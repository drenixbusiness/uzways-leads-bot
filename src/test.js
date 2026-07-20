// test.js
import { sendScheduledReport } from './scheduler.js';

sendScheduledReport()
  .then(() => console.log('Test tugadi'))
  .catch((err) => console.error('Xato:', err));

  import { sendScheduledReport } from './scheduler.js';
sendScheduledReport().then(() => console.log('Test tugadi'));