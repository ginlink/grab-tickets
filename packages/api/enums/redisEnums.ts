export enum RedisKeys {
  ACT_TICKET_CODES = 'activity_ticket_codes_{activityId}',
  ACT_USER_JOIN_RESULT = 'activity_join_{activityId}_user_id_{userId}',
  CODE_TICKET_MAPPING = 'code_{code}_with_ticket',
  TICKET_DETAIL_CACHE_KEY = 'ticket_info_id_{ticketId}',
  ACT_LIST_CACHE_KEY = 'activity_list_page_{page}',
  ACT_DETAIL_CACHE_KEY = 'activity_info_id_{activityId}',
}
export enum RedisReplaceKeys {
  ACT_TICKET_CODES = '{activityId}',
  ACT_USER_JOIN_RESULT_1 = '{activityId}',
  ACT_USER_JOIN_RESULT_2 = '{userId}',
  CODE_TICKET_MAPPING = '{code}',
  TICKET_DETAIL_CACHE_KEY = '{ticketId}',
  ACT_LIST_CACHE_KEY = '{page}',
  ACT_DETAIL_CACHE_KEY = '{activityId}',
}
