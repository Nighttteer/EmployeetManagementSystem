#!/usr/bin/env python
"""
测试运行脚本
提供便捷的测试运行方式和选项
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command):
    """运行命令并输出结果"""
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    
    return result.returncode

def main():
    parser = argparse.ArgumentParser(description='慢性病管理系统测试运行器')
    
    # 测试类型选项
    parser.add_argument('--unit', action='store_true', help='只运行单元测试')
    parser.add_argument('--integration', action='store_true', help='只运行集成测试')
    parser.add_argument('--api', action='store_true', help='只运行API测试')
    
    # 模块选项
    parser.add_argument('--accounts', action='store_true', help='只测试accounts模块')
    parser.add_argument('--health', action='store_true', help='只测试health模块')
    parser.add_argument('--medication', action='store_true', help='只测试medication模块')
    parser.add_argument('--communication', action='store_true', help='只测试communication模块')
    
    # 覆盖率选项
    parser.add_argument('--coverage', action='store_true', help='生成覆盖率报告')
    parser.add_argument('--html-coverage', action='store_true', help='生成HTML覆盖率报告')
    
    # 其他选项
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    parser.add_argument('--parallel', action='store_true', help='并行运行测试')
    parser.add_argument('--failfast', action='store_true', help='遇到第一个失败就停止')
    parser.add_argument('--reuse-db', action='store_true', help='重用测试数据库')
    
    # 特定测试
    parser.add_argument('--test', help='运行特定测试文件或测试方法')
    
    args = parser.parse_args()
    
    # 构建pytest命令
    cmd_parts = ['pytest']
    
    # 添加标记过滤器
    marks = []
    if args.unit:
        marks.append('unit')
    if args.integration:
        marks.append('integration')
    if args.api:
        marks.append('api')
    if args.accounts:
        marks.append('accounts')
    if args.health:
        marks.append('health')
    if args.medication:
        marks.append('medication')
    if args.communication:
        marks.append('communication')
    
    if marks:
        cmd_parts.extend(['-m', ' and '.join(marks)])
    
    # 添加覆盖率选项
    if args.coverage or args.html_coverage:
        cmd_parts.extend(['--cov=.', '--cov-report=term-missing'])
        if args.html_coverage:
            cmd_parts.append('--cov-report=html')
    
    # 添加其他选项
    if args.verbose:
        cmd_parts.append('-v')
    if args.parallel:
        cmd_parts.extend(['-n', 'auto'])
    if args.failfast:
        cmd_parts.append('-x')
    if args.reuse_db:
        cmd_parts.append('--reuse-db')
    
    # 添加特定测试
    if args.test:
        cmd_parts.append(args.test)
    
    # 运行测试
    command = ' '.join(cmd_parts)
    exit_code = run_command(command)
    
    # 如果生成了HTML覆盖率报告，提示用户
    if args.html_coverage and exit_code == 0:
        print("\n" + "="*50)
        print("HTML覆盖率报告已生成到 htmlcov/ 目录")
        print("打开 htmlcov/index.html 查看详细报告")
        print("="*50)
    
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
