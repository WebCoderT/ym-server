#!/bin/bash
# 清理脚本：删除业务特定模块，保留通用功能

set -e

cd "$(dirname "$0")"

echo "=== 开始清理业务模块 ==="

# 业务特定模块
BUSINESS_MODULES=(
  "card"
  "event"
  "ticket"
  "gift"
  "gift-tag"
  "goods"
  "goods-category"
  "order"
  "refund"
  "reward"
  "review"
  "fan-club"
  "star"
  "audience"
  "address"
  "hot-search-keyword"
  "logistics"
  "questionnaire"
  "customer-service"
  "shipping-config"
  "avatar-frame"
  "avatar-frame-cateory"
  "medal"
  "medal-cateory"
  "user-avatar-frame"
  "user-medal"
  "alipay-pay"
  "wechat-pay"
)

echo "1. 删除业务模块目录..."
for module in "${BUSINESS_MODULES[@]}"; do
  if [ -d "src/modules/$module" ]; then
    rm -rf "src/modules/$module"
    echo "   ✓ 已删除: src/modules/$module"
  fi
done

# 删除业务控制器
echo "2. 删除业务控制器..."
rm -f src/admin/admin-goods.controller.ts
rm -f src/admin/admin-goods-category.controller.ts
rm -f src/admin/admin-order.controller.ts
rm -f src/admin/admin-event.controller.ts
rm -f src/admin/admin-star.controller.ts
rm -f src/admin/admin-ticket.controller.ts
rm -f src/admin/admin-fan-club.controller.ts
rm -f src/admin/admin-gift.controller.ts
rm -f src/admin/admin-gift-tag.controller.ts
rm -f src/admin/admin-gift-record.controller.ts
rm -f src/admin/admin-reward.controller.ts
rm -f src/admin/admin-review.controller.ts
rm -f src/admin/admin-audience.controller.ts
rm -f src/admin/admin-address.controller.ts
rm -f src/admin/admin-hot-search-keyword.controller.ts
rm -f src/admin/admin-questionnaire.controller.ts
rm -f src/admin/admin-customer-service.controller.ts
rm -f src/admin/admin-shipping-config.controller.ts
rm -f src/admin/admin-avatar-frame.controller.ts
rm -f src/admin/admin-avatar-frame-cateory.controller.ts
rm -f src/admin/admin-medal.controller.ts
rm -f src/admin/admin-medal-cateory.controller.ts
rm -f src/admin/admin-rule.controller.ts
rm -f src/admin/admin-refund.controller.ts

rm -f src/client/client-goods.controller.ts
rm -f src/client/client-order.controller.ts
rm -f src/client/client-event.controller.ts
rm -f src/client/client-star.controller.ts
rm -f src/client/client-ticket.controller.ts
rm -f src/client/client-fan-club.controller.ts
rm -f src/client/client-gift.controller.ts
rm -f src/client/client-reward.controller.ts
rm -f src/client/client-review.controller.ts
rm -f src/client/client-audience.controller.ts
rm -f src/client/client-address.controller.ts
rm -f src/client/client-questionnaire.controller.ts
rm -f src/client/client-customer-service.controller.ts

echo ""
echo "3. 清理完成，保留的通用模块:"
ls -1 src/modules/

echo ""
echo "=== 清理完成 ==="
echo "接下来需要更新模块引用文件"
