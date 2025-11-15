"""
Test the Backend API
"""
import asyncio
import httpx


BASE_URL = "http://localhost:8000"


async def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Check ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/utils/healthz")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")


async def test_trigger_types():
    """Test trigger types endpoint"""
    print("\n=== Testing Trigger Types ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/utils/trigger-types")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Trigger Types: {list(data['trigger_types'].keys())}")


async def test_encode_workflow():
    """Test workflow encoding"""
    print("\n=== Testing Workflow Encoding ===")
    
    payload = {
        "trigger_type": 1,  # TIME
        "trigger_params": {
            "interval_seconds": 3600
        },
        "action_type": 1,  # NATIVE_TRANSFER
        "action_params": {
            "recipient": "0x1234567890123456789012345678901234567890",
            "amount": 1000000000000000000  # 1 DEV
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/api/workflow/encode", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Trigger Data: {data['trigger_data']}")
        print(f"Action Data: {data['action_data'][:66]}...")  # First 66 chars


async def test_price():
    """Test price endpoint"""
    print("\n=== Testing Price API ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/price/ethereum")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"ETH Price: ${data['price_usd']}")


async def test_balance():
    """Test escrow balance"""
    print("\n=== Testing Escrow Balance ===")
    test_address = "0x1234567890123456789012345678901234567890"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/escrow/balance/{test_address}")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Balance: {data['balance']} wei ({data['balance_eth']} DEV)")


async def main():
    """Run all tests"""
    print("=" * 60)
    print("Autometa Backend API Tests")
    print("=" * 60)
    
    try:
        await test_health()
        await test_trigger_types()
        await test_encode_workflow()
        await test_price()
        await test_balance()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except httpx.ConnectError:
        print("\n❌ ERROR: Could not connect to backend API")
        print("Make sure the backend is running: ./start.sh")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")


if __name__ == "__main__":
    asyncio.run(main())
