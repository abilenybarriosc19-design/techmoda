#!/bin/bash
#
# Logs viewer for TechModa Lambda functions
# View CloudWatch logs for Lambda functions with various options
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS] [FUNCTION]"
    echo ""
    echo "View CloudWatch logs for TechModa Lambda functions"
    echo ""
    echo "Arguments:"
    echo "  FUNCTION              Function to view (optional, defaults to all)"
    echo "                        Options: list, create, get, update, delete, all"
    echo ""
    echo "Options:"
    echo "  -t, --tail            Follow log output (live tail)"
    echo "  -f, --filter PATTERN  Filter logs by pattern (case-insensitive)"
    echo "  -e, --errors          Show only ERROR level logs"
    echo "  -s, --since TIME      Show logs since time ago (e.g., 10m, 1h, 1d)"
    echo "                        Default: 10m (10 minutes)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                              # View all functions (last 10 minutes)"
    echo "  $0 list                         # View list-items function logs"
    echo "  $0 --tail                       # Live tail all functions"
    echo "  $0 create --tail                # Live tail create-item function"
    echo "  $0 --errors                     # Show only errors from all functions"
    echo "  $0 list --filter \"product\"      # Filter list function logs"
    echo "  $0 --since 1h                   # Show logs from last hour"
    echo "  $0 update --since 30m --errors  # Show errors from last 30 min"
    echo ""
    echo "Function names (short aliases):"
    echo "  list   → ListItemsFunction"
    echo "  create → CreateItemFunction"
    echo "  get    → GetItemFunction"
    echo "  update → UpdateItemFunction"
    echo "  delete → DeleteItemFunction"
    echo "  all    → All functions (default)"
    echo ""
    exit 1
}

# Get stack name from samconfig.toml or use default
STACK_NAME="techmoda-ai-aby"
if [ -f "samconfig.toml" ]; then
    STACK_NAME=$(grep 'stack_name' samconfig.toml | cut -d'"' -f2 || echo "techmoda-ai-aby")
fi

# Default values
TAIL_MODE=false
FILTER_PATTERN=""
ERRORS_ONLY=false
SINCE="10m"
FUNCTION_FILTER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tail)
            TAIL_MODE=true
            shift
            ;;
        -f|--filter)
            FILTER_PATTERN="$2"
            shift 2
            ;;
        -e|--errors)
            ERRORS_ONLY=true
            FILTER_PATTERN="ERROR"
            shift
            ;;
        -s|--since)
            SINCE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        list|create|get|update|delete|all)
            FUNCTION_FILTER="$1"
            shift
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            echo ""
            usage
            ;;
    esac
done

# Map short names to full function names
case "$FUNCTION_FILTER" in
    list)
        FUNCTION_NAME="ListItemsFunction"
        ;;
    create)
        FUNCTION_NAME="CreateItemFunction"
        ;;
    get)
        FUNCTION_NAME="GetItemFunction"
        ;;
    update)
        FUNCTION_NAME="UpdateItemFunction"
        ;;
    delete)
        FUNCTION_NAME="DeleteItemFunction"
        ;;
    all|"")
        FUNCTION_NAME=""
        ;;
esac

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &>/dev/null; then
    echo -e "${RED}❌ Stack '$STACK_NAME' not found${NC}"
    echo ""
    echo "💡 Deploy the stack first:"
    echo "   ./scripts/deploy-all.sh"
    exit 1
fi

echo "=========================================="
echo "  TechModa - CloudWatch Logs Viewer"
echo "=========================================="
echo ""
echo -e "${BLUE}📊 Configuration:${NC}"
echo "   Stack:    $STACK_NAME"
if [ -n "$FUNCTION_NAME" ]; then
    echo "   Function: $FUNCTION_NAME"
else
    echo "   Function: All functions"
fi
echo "   Since:    $SINCE ago"
if [ "$TAIL_MODE" = true ]; then
    echo -e "   Mode:     ${GREEN}Live tail (Ctrl+C to stop)${NC}"
else
    echo "   Mode:     Historical"
fi
if [ -n "$FILTER_PATTERN" ]; then
    echo "   Filter:   \"$FILTER_PATTERN\""
fi
echo ""
echo "=========================================="
echo ""

# Build sam logs command
SAM_CMD="sam logs"

# Add function name if specified
if [ -n "$FUNCTION_NAME" ]; then
    SAM_CMD="$SAM_CMD --name $FUNCTION_NAME"
fi

# Add stack name
SAM_CMD="$SAM_CMD --stack-name $STACK_NAME"

# Add tail mode
if [ "$TAIL_MODE" = true ]; then
    SAM_CMD="$SAM_CMD --tail"
else
    # Add since parameter for historical logs
    SAM_CMD="$SAM_CMD --start-time \"$SINCE ago\""
fi

# Add filter if specified
if [ -n "$FILTER_PATTERN" ]; then
    SAM_CMD="$SAM_CMD --filter \"$FILTER_PATTERN\""
fi

# Display command being run (for debugging)
echo -e "${YELLOW}🔍 Running: ${NC}$SAM_CMD"
echo ""

# Execute the command
eval $SAM_CMD

# If we reach here (not in tail mode), show summary
if [ "$TAIL_MODE" = false ]; then
    echo ""
    echo "=========================================="
    echo ""
    echo "💡 Useful commands:"
    echo "   Live tail:      $0 --tail"
    echo "   Show errors:    $0 --errors"
    echo "   Specific func:  $0 list --tail"
    echo "   Longer period:  $0 --since 1h"
    echo ""
fi
