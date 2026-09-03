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


/* ---------- 읽기: 객실 정보 (db.json 직접 fetch) ---------- */

// db.json 파일 경로 — reservation3* 페이지와 같은 폴더(html/)에 있음.
// json-server 없이 정적 파일로도 rooms/price/season 을 한 번에 읽을 수 있어
// json-server 기동 여부와 무관하게 객실 정보가 표시된다.
// (예약 저장/조회 fetchBookedDates·createReservation 은 여전히 json-server 필요)
const DB_JSON_PATH = "db.json";

// room_id 하나에 대한 객실 정보를 db.json 에서 조립해 반환.
// - rooms[] : 이름/사진/설명/면적/인원 등
// - price[] : room_id 별 성수기·비수기 × 요일 요금
// - season[]: season_id → "비수기"/"성수기" 이름 매핑
//
// 반환 형태 (페이지에서 바로 쓰도록 정리):
// {
//   id, name, name_eng, area, capacity, min,
//   images: [...],            // "image/xxx.jpg" 전체 경로 배열
//   desc, desc_eng,
//   roomPrice: 150000,        // 기본 객실가 (비수기 주중) — 기존 ROOM_PRICE 호환
//   priceTable: {             // 기존 PRICE_TABLE 호환 (off/peak × 요일)
//     off:  { weekday, weekend, holiday },
//     peak: { weekday, weekend, holiday }
//   }
// }
async function getRoom(roomId) {
  // db.json 파일 전체를 한 번에 fetch (json-server 엔드포인트 3개 호출 대신)
  const res = await fetch(DB_JSON_PATH);
  if (!res.ok) throw new Error("db.json 로드 실패");
  const db = await res.json();

  const rooms = db.rooms || [];
  const prices = db.price || [];
  const seasons = db.season || [];

  // 1) room 기본 정보
  const room = rooms.find(r => Number(r.id) === Number(roomId));
  if (!room) throw new Error(`room_id ${roomId} 없음`);

  // 2) season_id → "비수기"/"성수기" 이름 (db.json 의 name 필드)
  //    비수기(이름에 '비수기' 포함) → off, 그 외 → peak
  const seasonNameById = {};
  seasons.forEach(s => { seasonNameById[s.id] = s.name; });

  // 3) price[] 에서 이 객실의 행들만 추려 PRICE_TABLE 조립
  //    db.json 의 season 구조(1=비수기/2=성수기)가 바뀔 수 있으므로,
  //    이름(비수기/성수기)으로 분류하여 off/peak 에 배정.
  const priceTable = { off: {}, peak: {} };
  prices
    .filter(p => Number(p.room_id) === Number(roomId))
    .forEach(p => {
      const key = /비수기/.test(seasonNameById[p.season_id] || "") ? "off" : "peak";
      priceTable[key] = {
        weekday: p.weekday_price,
        weekend: p.weekend_price,
        holiday: p.holiday_price,
      };
    });

  return {
    id: room.id,
    name: room.name,
    name_eng: room.name_eng,
    area: room.area,
    capacity: room.capacity,
    min: room.min,
    images: room.images || [],
    desc: room.desc,
    desc_eng: room.desc_eng,
    // 기존 하드코딩값(ROOM_PRICE)과 동일 기준: 비수기 주중
    roomPrice: priceTable.off.weekday,
    priceTable,
  };
}
