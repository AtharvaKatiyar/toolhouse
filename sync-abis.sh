#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  ABI Sync Script - Autometa Project
#  Syncs compiled contract ABIs from Hardhat to Python worker
# ═══════════════════════════════════════════════════════════════

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║              ABI Sync Script - Help                          ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  ./sync-abis.sh              Sync contract ABIs
  ./sync-abis.sh --help       Show this help

DESCRIPTION:
  Copies compiled contract ABIs from Hardhat artifacts to the
  Python worker folder for blockchain interaction.

WHAT IT DOES:
  1. Checks if contracts are compiled
  2. Creates worker/abi/ directory
  3. Copies ActionExecutor.json
  4. Copies FeeEscrow.json
  5. Copies WorkflowRegistry.json

FROM NPM:
  npm run sync-abi            (from contracts/ folder)
  npm run compile:sync        Compile + sync
  npm run deploy:sync         Deploy + sync

AFTER SYNCING:
  1. Update contract addresses in worker/.env
  2. Restart Python worker if running

SEE ALSO:
  ABI_SYNC_GUIDE.md - Complete documentation

EOF
    exit 0
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONTRACTS_DIR="$SCRIPT_DIR/contracts/artifacts/contracts"
WORKER_ABI_DIR="$SCRIPT_DIR/worker/abi"

# Contract files to sync
CONTRACTS=("ActionExecutor" "FeeEscrow" "WorkflowRegistry")

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║              📦 ABI SYNC SCRIPT                              ║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if contracts are compiled
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo -e "${RED}❌ Error: Contracts not compiled!${NC}"
    echo -e "${YELLOW}Run: cd contracts && npm run compile${NC}"
    exit 1
fi

# Create worker/abi directory if it doesn't exist
echo -e "${BLUE}📁 Creating ABI directory...${NC}"
mkdir -p "$WORKER_ABI_DIR"

# Track success/failure
COPIED=0
FAILED=0

echo -e "${BLUE}🔄 Copying ABI files...${NC}"
echo ""

# Copy each contract ABI
for contract in "${CONTRACTS[@]}"; do
    SOURCE="$CONTRACTS_DIR/$contract.sol/$contract.json"
    DEST="$WORKER_ABI_DIR/$contract.json"
    
    if [ -f "$SOURCE" ]; then
        cp "$SOURCE" "$DEST"
        
        # Get file size
        SIZE=$(du -h "$DEST" | cut -f1)
        
        echo -e "  ${GREEN}✓${NC} $contract.json (${SIZE})"
        COPIED=$((COPIED + 1))
    else
        echo -e "  ${RED}✗${NC} $contract.json (not found)"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Summary
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Success! All $COPIED ABI files synced${NC}"
    EXIT_CODE=0
else
    echo -e "${YELLOW}⚠️  Warning: $COPIED succeeded, $FAILED failed${NC}"
    EXIT_CODE=1
fi

echo ""
echo -e "${BLUE}📂 ABI files location:${NC}"
echo -e "   $WORKER_ABI_DIR/"
echo ""

# List files
if [ -d "$WORKER_ABI_DIR" ] && [ "$(ls -A $WORKER_ABI_DIR)" ]; then
    ls -lh "$WORKER_ABI_DIR/" | grep "\.json" | awk '{printf "   %-30s %s\n", $9, $5}'
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if deployment addresses exist
DEPLOYMENT_FILES=$(find "$SCRIPT_DIR/contracts/deployments" -name "*.json" 2>/dev/null)
if [ -n "$DEPLOYMENT_FILES" ]; then
    echo -e "${YELLOW}💡 Tip: Contract addresses are in:${NC}"
    echo "$DEPLOYMENT_FILES" | while read file; do
        echo -e "   $(basename $file)"
    done
    echo ""
fi

echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo -e "   1. Update contract addresses in worker/.env"
echo -e "   2. Restart the Python worker if running"
echo ""

exit $EXIT_CODE
