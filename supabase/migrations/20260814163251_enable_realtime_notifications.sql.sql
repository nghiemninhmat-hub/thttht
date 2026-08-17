/*
# Enable realtime on notifications table

Adds the notifications table to the Supabase realtime publication so the frontend
receives instant updates when new notifications are inserted.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;