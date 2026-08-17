/**
 * 业务错误消息常量
 * 集中管理各业务模块的错误提示信息，便于统一维护与国际化扩展
 */

export const BUSINESS_MESSAGES = {
  // ---------- 用户模块 ----------
  USER: {
    NOT_FOUND: (userId: string) => `用户 ${userId} 不存在`,
    PRIVACY_SETTING_NOT_FOUND: (userId: string) => `用户 ${userId} 的隐私设置不存在`,
  },

  // ---------- 活动模块 ----------
  EVENT: {
    NOT_FOUND: (eventId: string) => `活动 ${eventId} 不存在`,
  },

  // ---------- 票档模块 ----------
  TICKET_TIER: {
    NOT_FOUND: (tierId: string) => `票档 ${tierId} 不存在`,
  },

  // ---------- 商品模块 ----------
  GOODS: {
    NOT_FOUND: (goodsId: string) => `商品 ${goodsId} 不存在`,
    STOCK_INSUFFICIENT: '库存不足',
  },

  // ---------- 商品分类模块 ----------
  GOODS_CATEGORY: {
    NOT_FOUND: (id: string) => `分类 ${id} 不存在`,
  },

  // ---------- 热门搜索关键词模块 ----------
  HOT_SEARCH_KEYWORD: {
    NOT_FOUND: (id: string) => `热门搜索词 ${id} 不存在`,
  },

  // ---------- 订单模块 ----------
  ORDER: {
    NOT_FOUND: (orderId: string) => `订单 ${orderId} 不存在`,
    CANNOT_CANCEL: '只能取消待支付订单',
    CANNOT_PAY: '订单状态不允许支付',
    CANNOT_DELETE: '只能删除已取消或已完成的订单',
    CANNOT_CONFIRM_RECEIVE: '只能对已发货的订单确认收货',
    CANNOT_UPDATE_ADDRESS: '当前订单状态不允许修改地址',
    ADDRESS_ALREADY_MODIFIED: '每笔订单仅支持修改一次收货地址，当前订单已修改过',
    ADDRESS_NOT_FOUND: '收货地址不存在',
    PURCHASE_LIMIT_EXCEEDED: (limit: number, owned: number, remaining: number) =>
      remaining > 0
        ? `该活动每人限购 ${limit} 张，您已持有 ${owned} 张，本次数量超出剩余可购 ${remaining} 张`
        : `该活动每人限购 ${limit} 张，您已持有 ${owned} 张，无法继续购买`,
  },

  // ---------- 卡牌模块 ----------
  CARD: {
    POOL_NOT_FOUND: (poolId: string) => `卡池 ${poolId} 不存在`,
    CARD_NOT_FOUND: (cardId: string) => `卡片 ${cardId} 不存在`,
    NO_CARDS_IN_POOL: '卡池中没有卡片',
    RARITY_NOT_FOUND: (id: string) => `卡牌稀有度等级配置 ${id} 不存在`,
    CATEGORY_NOT_FOUND: (id: string) => `卡池分类 ${id} 不存在`,
    CARD_TICKET_NOT_FOUND: (ticketId: string) => `卡券 ${ticketId} 不存在`,
    CARD_TICKET_PLAN_NOT_FOUND: (planId: string) => `销售方案 ${planId} 不存在`,
    INSUFFICIENT_TICKET_BALANCE: '抽卡券余额不足，请先购买',
    POOL_NO_TICKET: (poolId: string) => `卡池 ${poolId} 未关联卡券，无法抽卡`,
    SYNTHESIS_NOT_ALLOWED: '该卡池未开放合成',
    INSUFFICIENT_MATERIAL: '材料卡片数量不足',
    NO_MATCHING_SYNTHESIS_RULE: '没有匹配的合成规则',
    NO_OUTPUT_CARD_AVAILABLE: '卡池中没有可合成的产物卡片',
    GRAND_PRIZE_NOT_FOUND: (id: string) => `终极大奖 ${id} 不存在`,
  },

  // ---------- 退票规则模块 ----------
  REFUND: {
    TEMPLATE_NOT_FOUND: (templateId: string) => `退票规则模板 ${templateId} 不存在`,
    APPLICATION_NOT_FOUND: (refundId: string) => `退款申请 ${refundId} 不存在`,
    CANNOT_SUBMIT_SHIPPING_NOT_APPROVED: '退款申请尚未通过审批，无法提交退货快递信息',
    CANNOT_SUBMIT_SHIPPING_ALREADY_SHIPPED: '退货快递信息已提交，请勿重复操作',
    CANNOT_CONFIRM_RECEIPT_NOT_SHIPPED: '买家尚未提交退货快递信息，无法确认收货',
    CANNOT_REJECT_NOT_IN_REVIEW_OR_SHIPPED: '当前退款申请状态不允许拒绝',
    REJECT_REASON_REQUIRED: '拒绝退款时必须填写拒绝原因',
  },

  // ---------- 图片模块 ----------
  IMAGE: {
    GROUP_NOT_FOUND: '分组不存在',
    NOT_FOUND: '图片不存在',
  },

  // ---------- 粉丝团模块 ----------
  FAN_CLUB: {
    NOT_FOUND: (fanClubId: string) => `粉丝团 ${fanClubId} 不存在`,
    LEVEL_NOT_FOUND: (levelId: string) => `等级 ${levelId} 不存在`,
    NOT_ENABLED: '该明星尚未开启粉丝团功能',
  },

  // ---------- 会员任务模块 ----------
  MEMBER_TASK: {
    NOT_FOUND: (taskId: string) => `任务 ${taskId} 不存在`,
  },

  // ---------- 会员等级模块 ----------
  MEMBER_LEVEL: {
    NOT_FOUND: (id: string) => `会员等级 ${id} 不存在`,
    NO_LEVEL: '您当前暂无会员等级，无法领取等级奖励',
    AVATAR_FRAME_NOT_ELIGIBLE: '该头像框不属于您当前会员等级的奖励，无法领取',
    MEDAL_NOT_ELIGIBLE: '该勋章不属于您当前会员等级的奖励，无法领取',
  },

  // ---------- 明星模块 ----------
  STAR: {
    NOT_FOUND: (starId: string) => `明星 ${starId} 不存在`,
  },

  // ---------- 评价模块 ----------
  REVIEW: {
    NOT_FOUND: (reviewId: string) => `评价 ${reviewId} 不存在`,
    ORDER_NOT_FOUND: (orderId: string) => `订单 ${orderId} 不存在`,
    ORDER_NOT_COMPLETED: '只能对已完成的商品订单进行评价',
    ALREADY_REVIEWED: '该订单已评价，请勿重复评价',
    ORDER_TYPE_NOT_SUPPORTED: '当前订单类型不支持评价',
  },

  // ---------- 通知模块 ----------
  NOTIFICATION: {
    NOT_FOUND: (id: string) => `通知 ${id} 不存在`,
  },

  // ---------- 快递公司模块 ----------
  COURIER_COMPANY: {
    NOT_FOUND: (id: string) => `快递公司 ${id} 不存在`,
  },

  // ---------- 头像框分类模块 ----------
  AVATAR_FRAME_CATEORY: {
    NOT_FOUND: (id?: string) => `头像框分类 ${id} 不存在`,
  },

  // ---------- 头像框模块 ----------
  AVATAR_FRAME: {
    NOT_FOUND: (id?: string) => `头像框 ${id} 不存在`,
  },

  // ---------- 用户头像框所有权模块 ----------
  USER_AVATAR_FRAME: {
    ALREADY_OWNED: '该头像框已拥有，请勿重复发放',
    NOT_OWNED: '未拥有该头像框',
  },

  // ---------- 勋章分类模块 ----------
  MEDAL_CATEORY: {
    NOT_FOUND: (id?: string) => `勋章分类 ${id} 不存在`,
  },

  // ---------- 勋章模块 ----------
  MEDAL: {
    NOT_FOUND: (id?: string) => `勋章 ${id} 不存在`,
  },

  // ---------- 用户勋章所有权模块 ----------
  USER_MEDAL: {
    ALREADY_OWNED: '该勋章已拥有，请勿重复发放',
    NOT_OWNED: '未拥有该勋章',
    ALREADY_WORN: '该勋章已佩戴',
    NOT_WORN: '该勋章未佩戴',
  },

  // ---------- 礼物标签模块 ----------
  GIFT_TAG: {
    NOT_FOUND: (id: string) => `礼物标签 ${id} 不存在`,
  },

  // ---------- 礼物模块 ----------
  GIFT: {
    NOT_FOUND: (id: string) => `礼物 ${id} 不存在`,
  },

  // ---------- 调查问卷模块 ----------
  QUESTIONNAIRE: {
    NOT_FOUND: (id: string) => `问卷 ${id} 不存在`,
    NOT_ENABLED: (id: string) => `问卷 ${id} 未启用`,
    QUESTION_NOT_FOUND: (id: string) => `问题 ${id} 不存在`,
    REQUIRED_ANSWER_MISSING: '请回答所有必填问题',
  },
} as const;
