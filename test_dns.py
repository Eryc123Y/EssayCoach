#!/usr/bin/env python3
"""Test DNS resolution with dnspython."""

import sys

sys.path.insert(0, "/Users/eric/Documents/GitHub/EssayCoach/backend")

print("=" * 60)
print("DNS 解析测试")
print("=" * 60)

# Test 1: Check if dnspython is available
print("\n1. 检查 dnspython...")
try:
    import dns.resolver

    print("   ✅ dnspython 已安装")
except ImportError as e:
    print(f"   ❌ dnspython 未安装: {e}")
    sys.exit(1)

# Test 2: Use dnspython with custom DNS servers
print("\n2. 使用 Cloudflare/Google DNS 解析...")
try:
    resolver = dns.resolver.Resolver()
    resolver.nameservers = ["1.1.1.1", "8.8.8.8"]  # Cloudflare and Google DNS

    answers = resolver.resolve("api.siliconflow.ai", "A")
    print("   ✅ DNS 解析成功:")
    for rdata in answers:
        print(f"      地址: {rdata.address} (TTL: {rdata.ttl}秒)")
except Exception as e:
    print(f"   ❌ DNS 解析失败: {e}")
    sys.exit(1)

# Test 3: Use requests library
print("\n3. 测试 requests 库...")
try:
    import requests

    r = requests.get("https://api.siliconflow.ai", timeout=10)
    print(f"   ✅ HTTP 请求成功: {r.status_code}")
except Exception as e:
    print(f"   ❌ HTTP 请求失败: {type(e).__name__}")
    print(f"      错误: {str(e)[:200]}")

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
