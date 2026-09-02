# 导入路径批量替换脚本（Python版本）

import os
import re

def replace_imports(directory):
    """批量替换 Go 文件中的导入路径"""
    old_pattern = r'"pantheon-base/'
    new_pattern = '"github.com/duanxldragon/pantheon-base/backend/'

    count = 0
    files_modified = 0

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.go'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    if old_pattern in content:
                        new_content = content.replace(old_pattern, new_pattern)
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)

                        occurrences = content.count(old_pattern)
                        count += occurrences
                        files_modified += 1
                        print(f"[OK] {filepath} ({occurrences} replacements)")

                except Exception as e:
                    print(f"[ERROR] {filepath}: {e}")

    return files_modified, count

if __name__ == '__main__':
    directory = '.'
    print("开始批量替换导入路径...\n")

    files, occurrences = replace_imports(directory)

    print(f"\n完成！")
    print(f"- 修改文件数: {files}")
    print(f"- 替换次数: {occurrences}")
    print(f"\n请运行: go mod tidy && go build ./...")
