/* =========================================================
   공통 예약 API 모듈 (reservation-api.js)
   json-server + db.json 으로 예약 데이터를 읽고 쓴다.
   모든 예약 페이지(3, 3-2, 3-3, 3-4, 4)에서 room_id만 바꿔서 재사용.

   ▶ json-server 실행 필수:
       cd src/day7 && npm install && npm start
     → http://localhost:3000/reservation 으로 접근 가능
   ========================================================= */

// json-server 주소 (포트 3000, reservation 컬렉션)
const API_BASE = "http://localhost:3000/reservation";

// 객실 이름(영문) ↔ room_id 매핑. 모든 페이지에서 이걸로 변환.
const ROOM_ID_MAP = {
  STANDARD: 1,
  DELUXE:   2,
  PREMIUM:  3,
  SWEET:    4
};

// 객실 이름 → room_id
function getRoomId(roomName) {
  return ROOM_ID_MAP[roomName] || 1;
}


/* ---------- 유틸: 날짜 ↔ 문자열 ---------- */

// Date → "YYYY-MM-DD"
function dateToStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "YYYY-MM-DD" → Date
function strToDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}


/* ---------- 읽기: 예약 목록 ---------- */

// 전체 예약 가져오기 (필요시 room_id로 필터링 가능)
async function fetchReservations() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("예약 목록 조회 실패");
  return res.json();
}

// 특정 객실의 예약을 바탕으로 "예약완료" 날짜 배열 반환
// → check_in_date ~ check_out_date 전날(check_out 제외)을 점유 날짜로 계산
async function fetchBookedDates(roomId) {
  const list = await fetchReservations();
  const booked = [];

  list
    .filter(r => Number(r.room_id) === Number(roomId))
    .forEach(r => {
      const cur = strToDate(r.check_in_date);
      const last = strToDate(r.check_out_date);   // 체크아웃은 점유 안 함(퇴실일)
      while (cur < last) {
        booked.push(dateToStr(cur));
        cur.setDate(cur.getDate() + 1);
      }
    });

  // 중복 제거해서 반환
  return Array.from(new Set(booked));
}


/* ---------- 쓰기: 신규 예약 저장 (POST) ---------- */

// 새 예약 객체를 만들어 json-server에 저장
async function createReservation({ roomId, checkIn, checkOut, totalPrice, guests, name, phone }) {
  const body = {
    room_id: Number(roomId),
    check_in_date: checkIn,
    check_out_date: checkOut,
    total_price: Number(totalPrice),
    number_of_guests: Number(guests),
    customer_name: name,
    phone_number: phone
  };

  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error("예약 저장 실패");
  return res.json();   // 저장된 객체(id 포함) 반환
}
