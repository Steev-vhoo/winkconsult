-- Track the email alert sent to staff for each new enquiry.
alter table enquiries add column if not exists notified_at timestamptz;
alter table enquiries add column if not exists notify_error text not null default '';
