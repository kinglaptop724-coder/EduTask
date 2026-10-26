// วาง URL ของ Apps Script Web App (ลงท้ายด้วย /exec) ไว้ระหว่างเครื่องหมายคำพูด
// ตัวอย่าง: window.EDUTASK_API='https://script.google.com/macros/s/AKfycb.../exec';
window.EDUTASK_API='https://script.google.com/macros/s/AKfycbyQV7DLbKa4kxdQQp_zPF7y9JyQr2QeSX3d8p3V7PpC2QUzzUUA05Vi2_u860e6uqE8/exec';

// ===== แจ้งเตือนบนมือถือ (Firebase Cloud Messaging) =====
// ค่าเหล่านี้ไม่ใช่ความลับ วางบน GitHub ได้ (ดูวิธีหาค่าใน README หัวข้อ "แจ้งเตือนบนมือถือ")
// ถ้ายังไม่ได้ตั้ง ปล่อยเป็น '' ไว้ ระบบจะไม่แสดงปุ่มแจ้งเตือน และส่วนอื่นทำงานตามปกติ
window.EDUTASK_FCM={
  apiKey:'',
  projectId:'',
  messagingSenderId:'',
  appId:'',
  vapidKey:''
};
