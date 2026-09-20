import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';

// 云服务公共配置（来自 workbuddy_cloud_service 激活结果，安全可置于前端）
export const cloud = createWorkBuddyCloud({
  endpoint: 'https://lukeyu-blog.app.workbuddy.host',
  publishableKey: 'wbpk_R80juD14JQN0hLU9LNT24L_t5OXA1d5tmdp1PNRSDOmCyIngfGhUizH',
});
