export const AndroidImportance = { HIGH: 4 };
export const SchedulableTriggerInputTypes = { DAILY: 'daily', DATE: 'date' };
export function setNotificationHandler() {}
export async function setNotificationChannelAsync() {}
export async function getPermissionsAsync() { return { granted: false }; }
export async function requestPermissionsAsync() { return { granted: false }; }
export async function getAllScheduledNotificationsAsync() { return []; }
export async function cancelScheduledNotificationAsync() {}
export async function scheduleNotificationAsync() { return ''; }
