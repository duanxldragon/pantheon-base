package database

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/casbin/casbin/v2/persist"
	"github.com/redis/go-redis/v9"
)

const casbinPolicyReloadChannel = "pantheon:casbin:policy"

var (
	casbinWatcherMu sync.RWMutex
	casbinWatcher   persist.Watcher
)

func shouldEnableCasbinWatcher() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv("PANTHEON_CASBIN_WATCHER")), "true")
}

func initCasbinWatcher(client *redis.Client) persist.Watcher {
	if client == nil || !shouldEnableCasbinWatcher() {
		return nil
	}
	return newRedisCasbinWatcher(client)
}

func setCasbinWatcher(watcher persist.Watcher) {
	casbinWatcherMu.Lock()
	defer casbinWatcherMu.Unlock()

	if casbinWatcher != nil && casbinWatcher != watcher {
		casbinWatcher.Close()
	}
	casbinWatcher = watcher
}

// NotifyCasbinWatcher publishes a policy reload signal to other instances.
func NotifyCasbinWatcher() {
	casbinWatcherMu.RLock()
	watcher := casbinWatcher
	casbinWatcherMu.RUnlock()
	if watcher == nil {
		return
	}
	if err := watcher.Update(); err != nil {
		slog.Warn("casbin watcher update failed", "error", err)
	}
}

type redisCasbinWatcher struct {
	client     *redis.Client
	channel    string
	instanceID string

	callbackMu sync.RWMutex
	callback   func(string)

	stateMu sync.Mutex
	pubsub  *redis.PubSub

	ctx    context.Context
	cancel func()

	closeOnce sync.Once
}

func newRedisCasbinWatcher(client *redis.Client) persist.Watcher {
	if client == nil {
		return nil
	}

	ctx, cancel := context.WithCancel(context.Background())
	watcher := &redisCasbinWatcher{
		client:     client,
		channel:    casbinPolicyReloadChannel,
		instanceID: fmt.Sprintf("%d-%d", os.Getpid(), time.Now().UnixNano()),
		ctx:        ctx,
		cancel:     cancel,
	}
	go watcher.run()
	return watcher
}

func (w *redisCasbinWatcher) run() {
	pubsub := w.client.Subscribe(w.ctx, w.channel)
	w.stateMu.Lock()
	w.pubsub = pubsub
	w.stateMu.Unlock()
	defer func() {
		_ = pubsub.Close()
	}()

	if _, err := pubsub.Receive(w.ctx); err != nil {
		if !errorsIsContextCanceled(w.ctx, err) {
			slog.Warn("casbin watcher subscription failed", "error", err)
		}
		return
	}

	for {
		select {
		case <-w.ctx.Done():
			return
		case msg, ok := <-pubsub.Channel():
			if !ok {
				return
			}
			if strings.TrimSpace(msg.Payload) == "" || msg.Payload == w.instanceID {
				continue
			}
			callback := w.getCallback()
			if callback != nil {
				callback(msg.Payload)
			}
		}
	}
}

func (w *redisCasbinWatcher) getCallback() func(string) {
	w.callbackMu.RLock()
	defer w.callbackMu.RUnlock()
	return w.callback
}

func (w *redisCasbinWatcher) SetUpdateCallback(callback func(string)) error {
	w.callbackMu.Lock()
	w.callback = callback
	w.callbackMu.Unlock()
	return nil
}

func (w *redisCasbinWatcher) Update() error {
	return w.client.Publish(w.ctx, w.channel, w.instanceID).Err()
}

func (w *redisCasbinWatcher) Close() {
	w.closeOnce.Do(func() {
		w.cancel()
		w.stateMu.Lock()
		if w.pubsub != nil {
			_ = w.pubsub.Close()
			w.pubsub = nil
		}
		w.stateMu.Unlock()
	})
}

func errorsIsContextCanceled(ctx context.Context, err error) bool {
	if err == nil {
		return false
	}
	return ctx.Err() != nil
}
