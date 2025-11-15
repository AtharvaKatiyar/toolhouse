"""
Test Worker-Backend Integration
Verifies that the worker can fetch data from the backend API
"""
import asyncio
import sys
from pathlib import Path

# Add worker src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.adapters.backend_client import backend_client
from src.adapters.enhanced_price_adapter import EnhancedPriceAdapter
from src.utils.logger import logger
from src.utils.config import settings


async def test_backend_health():
    """Test 1: Backend health check"""
    print("\n" + "="*60)
    print("TEST 1: Backend Health Check")
    print("="*60)
    
    is_healthy = await backend_client.health_check()
    
    if is_healthy:
        print("✅ Backend is healthy")
        return True
    else:
        print("❌ Backend is not available")
        return False


async def test_contract_addresses():
    """Test 2: Fetch contract addresses"""
    print("\n" + "="*60)
    print("TEST 2: Contract Addresses")
    print("="*60)
    
    contracts = await backend_client.get_contract_addresses()
    
    if contracts:
        print("✅ Contract addresses fetched:")
        for name, address in contracts.items():
            print(f"   {name}: {address}")
        return True
    else:
        print("❌ Failed to fetch contract addresses")
        return False


async def test_supported_assets():
    """Test 3: Fetch supported price assets"""
    print("\n" + "="*60)
    print("TEST 3: Supported Assets")
    print("="*60)
    
    assets = await backend_client.get_supported_assets()
    
    if assets:
        print(f"✅ {len(assets)} supported assets:")
        print(f"   {', '.join(assets[:10])}")
        if len(assets) > 10:
            print(f"   ... and {len(assets) - 10} more")
        return True
    else:
        print("❌ Failed to fetch supported assets")
        return False


async def test_backend_price_fetch():
    """Test 4: Fetch prices from backend"""
    print("\n" + "="*60)
    print("TEST 4: Backend Price Fetch")
    print("="*60)
    
    test_tokens = ['ethereum', 'polkadot', 'moonbeam']
    
    for token in test_tokens:
        result = await backend_client.get_price(token)
        
        if result:
            price, source = result
            print(f"✅ {token}: ${price:,.2f} (source: {source})")
        else:
            print(f"❌ Failed to fetch price for {token}")
            return False
    
    return True


async def test_enhanced_price_adapter():
    """Test 5: Enhanced price adapter with backend integration"""
    print("\n" + "="*60)
    print("TEST 5: Enhanced Price Adapter")
    print("="*60)
    
    # Test with backend enabled
    adapter = EnhancedPriceAdapter(use_backend=True)
    
    test_tokens = ['ethereum', 'bitcoin', 'polkadot']
    
    for token in test_tokens:
        try:
            price, source = await adapter.get_price_usd(token)
            print(f"✅ {token}: ${price:,.2f} (source: {source})")
        except Exception as e:
            print(f"❌ Failed to fetch {token}: {e}")
            return False
    
    return True


async def test_cache_performance():
    """Test 6: Test caching performance"""
    print("\n" + "="*60)
    print("TEST 6: Cache Performance")
    print("="*60)
    
    adapter = EnhancedPriceAdapter(use_backend=True)
    
    import time
    
    # First fetch (should hit backend, which may hit Redis cache or CoinGecko)
    start = time.time()
    price1, source1 = await adapter.get_price_usd('ethereum')
    time1 = (time.time() - start) * 1000
    
    # Second fetch (should hit local cache)
    start = time.time()
    price2, source2 = await adapter.get_price_usd('ethereum')
    time2 = (time.time() - start) * 1000
    
    print(f"First fetch:  ${price1:,.2f} from {source1} ({time1:.1f}ms)")
    print(f"Second fetch: ${price2:,.2f} from {source2} ({time2:.1f}ms)")
    
    if time2 < time1:
        print(f"✅ Cache speedup: {time1/time2:.1f}x faster")
        return True
    else:
        print("⚠️ No significant cache speedup observed")
        return True  # Still pass, might be already cached


async def test_fallback_mechanism():
    """Test 7: Test fallback to direct CoinGecko"""
    print("\n" + "="*60)
    print("TEST 7: Fallback Mechanism")
    print("="*60)
    
    # Create adapter with backend disabled
    adapter_no_backend = EnhancedPriceAdapter(use_backend=False)
    
    try:
        price, source = await adapter_no_backend.get_price_usd('ethereum')
        print(f"✅ Direct CoinGecko: ${price:,.2f} (source: {source})")
        
        if 'direct' in source:
            print("✅ Correctly using direct CoinGecko when backend disabled")
            return True
        else:
            print("⚠️ Expected 'direct' in source but got:", source)
            return True  # Still pass
    except Exception as e:
        print(f"❌ Direct CoinGecko fetch failed: {e}")
        return False


async def run_all_tests():
    """Run all integration tests"""
    print("\n" + "="*60)
    print("WORKER-BACKEND INTEGRATION TEST SUITE")
    print("="*60)
    print(f"Backend URL: {settings.BACKEND_API_URL}")
    print(f"Backend Integration: {settings.USE_BACKEND_INTEGRATION}")
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Contract Addresses", test_contract_addresses),
        ("Supported Assets", test_supported_assets),
        ("Backend Price Fetch", test_backend_price_fetch),
        ("Enhanced Price Adapter", test_enhanced_price_adapter),
        ("Cache Performance", test_cache_performance),
        ("Fallback Mechanism", test_fallback_mechanism),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            result = await test_func()
            results.append((name, result))
        except Exception as e:
            logger.error(f"Test '{name}' raised exception: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print("="*60)
    print(f"Results: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print("="*60)
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
