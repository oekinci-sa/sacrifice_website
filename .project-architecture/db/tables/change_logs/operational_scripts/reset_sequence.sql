SELECT pg_get_serial_sequence('change_logs', 'event_id');
ALTER SEQUENCE change_logs_event_id_seq RESTART WITH 1;
