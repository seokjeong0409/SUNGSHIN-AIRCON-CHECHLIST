/* =========================================================
   0. 설정값 (나중에 실제 현장 정보로 바꿀 부분은 여기뿐입니다)
   ========================================================= */

// 점검자 목록 - 필요에 맞게 이름을 수정/추가/삭제하세요
const CHECKER_NAMES = ["안병일", "홍지원", "전기팀 사무실"];

// 위치(대분류) / 위치2(소분류) 목록
// - 대분류 하나당 소분류 배열을 넣어주세요.
// - 소분류 배열을 비워두면([]) 그 대분류를 선택했을 때 목록 대신 "직접입력 칸"이 자동으로 나타납니다.
//   (아직 소분류를 안 적은 대분류나, '기타'처럼 원래 직접입력이 필요한 경우 모두 배열을 []로 두면 됩니다)
const SITE_CATEGORIES = {
  "특고 MCC": [
    "3,4호 특고",
    "2호 특고",
    "5호 특고",
    "6호 특고"
  ],
  "CO-METER Room": [
    "K/L #1 VOLTEX CO ROOM",
    "K/L #2 K,C-LINE IDF CO ROOM",
    "K/L #2 VOLTEX CO ROOM",
    "K/L #3 K-LINE IDF CO ROOM",
    "K/L #3 C-LINE IDF CO ROOM",
    "K/L #3 VOLTEX CO ROOM",
    "K/L #5 IDF CO ROOM",
    "CO/M #3,4 CO-METER ROOM"
  ],
  "Kiln MCC (B/H포함)": [
    "K/L #1 MCC",
    "1공장 K/L CPR ROOM",
    "K/L #1,2 CPR ROOM",
    "K/L #2 MCC",
    "K/L #2 B/H MCC",
    "K/L #2 COOLER E/P MCC",
    "K/L #3 B/H MCC",
    "K/L #3 DC MAIN DRIVE ROOM",
    "K/L #5 MCC",
    "K/L #5 INVERTER ROOM",
    "K/L #6 INVERTER ROOM",
    "K/L #6 MCC"
  ],
  "Cooler MCC": [
    "#2 COOLER E/P MCC",
    "#3 COOLER MCC",
    "#5 COOLER MCC",
    "#6 COOLER MCC"
  ],
  "Raw Mill MCC": [
    "R/M #1,2 MCC",
    "R/M #3 MCC(구)",
    "R/M #3 MCC(신)",
    "R/M #4 MCC",
    "R/M #5 MCC",
    "R/M #6 MCC",
    "R/M #7,8 MCC"
  ],
  "Coal Mill MCC": [
    "Co/M #1,2 MCC",
    "Co/M #2,4 MCC"
  ],
  "Cement Mill MCC (도착물, 치장 포함)": [
    "C/M #1,2 MCC",
    "C/M #3,4 MCC",
    "C/M #5-7 MCC",
    "C/M #8 MCC",
    "C/M #9,10 MCC",
    "C/M #11-13 MCC",
    "PGR MCC",
    "돔치장 MCC",
    "1차 Coal 치장 MCC",
    "Bulk장 MCC",
    "포장실 #1-3 MCC",
    "포장실 #4,5 MCC",
    "도착물 MCC"
  ],

  "공업용수": [
    "1공장 공업용수 MCC",
    "2공장 공업용수 MCC"
  ],
  "광산 Part": [
    "광산 변전실",
    "#1 P/Cr MCC",
    "#2 P/Cr MCC",
    "#3 P/Cr MCC",
    "S/Cr MCC",
    "1호 STACKER",
    "2호 STACKER",
    "1호 RECLAIMER",
    "2호 RECLAIMER",
    "3호 RECLAIMER",
    "3호 Premixing MCC"
  ],
  "기타": []
};

// ---------------------------------------------------------
// 텔레그램 설정 (반드시 아래 두 값을 채워 넣어야 전송이 됩니다)
// 봇 토큰 만드는 법 / 채팅방 ID 확인하는 법은 대화창에서 안내드린 절차를 참고하세요.
// ---------------------------------------------------------
const TELEGRAM_BOT_TOKEN = "8929061697:AAEnFkuzIVaenvOPh5cVvww9QMOJHEZDQkk";   // 
const TELEGRAM_CHAT_ID   = "-5300662112";  // 

// 브라우저에 데이터를 잠시 저장해두는 열쇠 이름 (앱을 새로고침해도 목록이 안 사라지게 해줌)
const STORAGE_KEY_NORMAL_LIST = "mcc_pending_normal_list";
const STORAGE_KEY_CHECKER_NAME = "mcc_last_checker_name";

// 정상 대기 목록에 담긴 항목이 이 시간(시간 단위)이 지나면 자동으로 사라집니다.
// 예: 12로 두면, 오늘 추가한 항목이 다음날 12시간이 지난 뒤 앱을 열었을 때 자동으로 비워집니다.
const NORMAL_LIST_EXPIRY_HOURS = 12;

// "이상없음" 항목들이 임시로 쌓이는 목록 (일괄 전송 전까지 여기 보관됨)
let pendingNormalList = [];


/* =========================================================
   1. 초기화: 화면이 열리면 실행되는 코드
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  fillSelectOptions("checkerName", CHECKER_NAMES);
  prefillLastCheckerName();
  setupSiteLocationCascade();
  setupOptionButtonGroups();
  setupAbnormalToggle();
  setupPhotoInputs();
  setupFormSubmit();
  setupConfirmScreenButtons();
  loadPendingListFromStorage();
  renderNormalStatusBar();
  setupNormalListButtons();
});

// 마지막으로 선택했던 점검자를 기억해뒀다가 자동으로 선택해주는 함수
function prefillLastCheckerName() {
  const saved = localStorage.getItem(STORAGE_KEY_CHECKER_NAME);
  if (saved) document.getElementById("checkerName").value = saved;
}

function saveCheckerName(name) {
  localStorage.setItem(STORAGE_KEY_CHECKER_NAME, name);
}

// select 태그에 옵션 목록을 채워 넣는 함수
function fillSelectOptions(selectId, optionList) {
  const select = document.getElementById(selectId);
  optionList.forEach((optionText) => {
    const opt = document.createElement("option");
    opt.value = optionText;
    opt.textContent = optionText;
    select.appendChild(opt);
  });
}


/* =========================================================
   1-1. 위치(대분류) 선택 -> 위치2(소분류) 자동 변경
   ========================================================= */
function setupSiteLocationCascade() {
  const categorySelect = document.getElementById("siteCategory");

  // 대분류 select에 SITE_CATEGORIES의 key 목록을 채워 넣음
  fillSelectOptions("siteCategory", Object.keys(SITE_CATEGORIES));

  // 대분류를 바꿀 때마다 소분류 영역을 갱신
  categorySelect.addEventListener("change", updateSubLocationField);

  // 처음 화면이 열렸을 때도 한 번 실행 (아직 선택 전 상태로 정리)
  updateSubLocationField();
}

// 선택된 대분류에 맞춰 소분류를 "select 목록" 또는 "직접입력 칸" 중 하나로 보여주는 함수
function updateSubLocationField() {
  const category = document.getElementById("siteCategory").value;
  const subSelect = document.getElementById("siteSubLocation");
  const subCustomInput = document.getElementById("siteSubCustom");
  const subList = SITE_CATEGORIES[category] || [];

  // 일단 둘 다 초기화
  subSelect.innerHTML = "";
  subSelect.style.display = "none";
  subSelect.required = false;
  subCustomInput.style.display = "none";
  subCustomInput.required = false;
  subCustomInput.value = "";

  if (!category) {
    return; // 대분류를 아직 안 골랐으면 소분류 칸은 숨김 상태로 대기
  }

  if (subList.length > 0) {
    // 소분류 목록이 있는 경우 -> select 박스로 보여줌
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- 선택하세요 --";
    subSelect.appendChild(defaultOpt);
    fillSelectOptions("siteSubLocation", subList);

    subSelect.style.display = "block";
    subSelect.required = true;
  } else {
    // 소분류 목록이 아직 없거나 '기타'인 경우 -> 직접입력 칸으로 보여줌
    subCustomInput.style.display = "block";
    subCustomInput.required = true;
  }
}

// 현재 화면에 보이는 소분류 값을 가져오는 함수 (select든 직접입력이든 상관없이 값만 꺼내옴)
function getSubLocationValue() {
  const subSelect = document.getElementById("siteSubLocation");
  const subCustomInput = document.getElementById("siteSubCustom");
  return subSelect.style.display !== "none" ? subSelect.value.trim() : subCustomInput.value.trim();
}


/* =========================================================
   2. 선택형 버튼 그룹 (이상 유무)
   ========================================================= */
function setupOptionButtonGroups() {
  const groups = document.querySelectorAll(".btn-group");

  groups.forEach((group) => {
    const groupName = group.dataset.group;                   // 예: "abnormalFlag"
    const hiddenInput = document.getElementById(groupName);  // 값 저장용 hidden input
    const buttons = group.querySelectorAll(".option-btn");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // 같은 그룹 내 다른 버튼의 선택 표시를 먼저 해제
        buttons.forEach((b) => b.classList.remove("active"));
        // 클릭한 버튼만 선택 표시
        btn.classList.add("active");
        // 실제 값은 hidden input에 저장 (폼 제출/검증에 사용)
        hiddenInput.value = btn.dataset.value;

        // hidden input에 값이 바뀌었다는 신호를 보내서
        // 이상유무 감지 로직(setupAbnormalToggle)이 반응하도록 함
        hiddenInput.dispatchEvent(new Event("change"));
      });
    });
  });
}


/* =========================================================
   3. "이상 유무"에서 이상 선택 시 이상 내용 입력란 + 사진 첨부란 표시
   ========================================================= */
function setupAbnormalToggle() {
  const abnormalFlagInput = document.getElementById("abnormalFlag");
  const abnormalDetailField = document.getElementById("abnormalDetailField");
  const photoField = document.getElementById("photoField");

  abnormalFlagInput.addEventListener("change", () => {
    const isAbnormal = abnormalFlagInput.value === "이상";
    // 이상일 때만 이상 내용 입력란 + 사진 첨부란 표시
    abnormalDetailField.style.display = isAbnormal ? "block" : "none";
    photoField.style.display = isAbnormal ? "block" : "none";
  });
}


/* =========================================================
   4. 사진 첨부 (촬영 / 갤러리 선택 공용 처리)
   ========================================================= */
// file: 실제 업로드에 사용할 파일 객체, dataUrl: 화면 미리보기용
let attachedPhotos = [];

function setupPhotoInputs() {
  const captureInput = document.getElementById("photoCapture");
  const galleryInput = document.getElementById("photoGallery");

  captureInput.addEventListener("change", (e) => handlePhotoSelect(e.target.files));
  galleryInput.addEventListener("change", (e) => handlePhotoSelect(e.target.files));
}

function handlePhotoSelect(fileList) {
  Array.from(fileList).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      attachedPhotos.push({ file: file, dataUrl: e.target.result });
      renderPhotoPreview();
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotoPreview() {
  const wrap = document.getElementById("photoPreviewWrap");
  wrap.innerHTML = "";

  attachedPhotos.forEach((photo, index) => {
    const thumb = document.createElement("div");
    thumb.className = "photo-thumb";

    const img = document.createElement("img");
    img.src = photo.dataUrl;
    thumb.appendChild(img);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "photo-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      attachedPhotos.splice(index, 1);
      renderPhotoPreview();
    });
    thumb.appendChild(removeBtn);

    wrap.appendChild(thumb);
  });
}


/* =========================================================
   5. 폼 제출 -> 확인 화면 표시
   ========================================================= */
function setupFormSubmit() {
  const form = document.getElementById("checkForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.reportValidity()) {
      // 텍스트/선택(select) 등 일반 입력창의 필수 검사
      return;
    }

    if (!validateButtonGroups()) {
      // 이상 유무 버튼 선택 여부 검사 (hidden input은 required 검사가 자동 적용되지 않음)
      return;
    }

    // 다음 개소 입력 시 다시 고르지 않도록 점검자 선택값을 기억해둠
    saveCheckerName(document.getElementById("checkerName").value);

    const abnormalFlag = document.getElementById("abnormalFlag").value;

    if (abnormalFlag === "이상") {
      // 이상 항목 -> 확인화면을 거쳐 즉시 전송
      showConfirmScreen();
    } else {
      // 이상없음 항목 -> 바로 전송하지 않고 목록에만 추가
      addToNormalList();
    }
  });
}

// 큰 버튼으로 선택하는 항목은 hidden input에 값이 저장되는데,
// hidden 타입은 브라우저의 기본 required 검사가 적용되지 않으므로 직접 검사합니다.
function validateButtonGroups() {
  const requiredGroups = [
    { id: "abnormalFlag", label: "이상 유무" }
  ];

  for (const group of requiredGroups) {
    const hiddenInput = document.getElementById(group.id);
    if (!hiddenInput.value) {
      alert(`"${group.label}" 항목을 선택해주세요.`);
      const fieldEl = hiddenInput.closest(".field");
      if (fieldEl) fieldEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
  }
  return true;
}

// 확인 화면에 보여줄 항목 라벨 정의
// (siteCategory / siteSubLocation은 목록·직접입력이 섞여 있어 showConfirmScreen에서 따로 처리합니다)
const CONFIRM_FIELD_LIST = [
  { id: "checkerName", label: "점검자" },
  { id: "acLocation", label: "에어컨 위치" },
  { id: "acSpec", label: "에어컨 규격" },
  { id: "abnormalFlag", label: "이상 유무" },
  { id: "abnormalDetail", label: "이상 내용" },
  { id: "materials", label: "필요한 자재" }
];

// 위치(대분류) / 위치2(소분류) 한 줄을 confirmContent에 추가하는 함수
function appendConfirmRow(container, label, value) {
  if (!value) return;
  const row = document.createElement("div");
  row.className = "confirm-row";

  const labelEl = document.createElement("span");
  labelEl.className = "c-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "c-value";
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  container.appendChild(row);
}


/* =========================================================
   5-1. "이상없음" 항목을 정상 대기 목록에 담아두기
   ========================================================= */
function addToNormalList() {
  const entry = {
    siteCategory: document.getElementById("siteCategory").value.trim(),
    siteSubLocation: getSubLocationValue(),
    acLocation: document.getElementById("acLocation").value.trim(),
    acSpec: document.getElementById("acSpec").value.trim(),
    materials: document.getElementById("materials").value.trim(),
    time: Date.now() // 자동 만료 판단에 사용되는 등록 시각
  };

  pruneExpiredEntries(); // 새 항목을 넣기 전에, 너무 오래된 항목부터 먼저 정리
  pendingNormalList.push(entry);
  savePendingListToStorage();
  renderNormalStatusBar();

  alert(`정상 점검 목록에 추가되었습니다. (현재 ${pendingNormalList.length}건)`);

  // 점검자는 유지한 채로 나머지 입력창만 비워서 바로 다음 개소를 입력할 수 있게 함
  resetForm({ keepChecker: true });
}

// 등록된 지 NORMAL_LIST_EXPIRY_HOURS 시간이 지난 항목을 목록에서 자동으로 제거
function pruneExpiredEntries() {
  const expiryMs = NORMAL_LIST_EXPIRY_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  const beforeCount = pendingNormalList.length;

  pendingNormalList = pendingNormalList.filter((entry) => (now - entry.time) < expiryMs);

  if (pendingNormalList.length !== beforeCount) {
    savePendingListToStorage();
  }
}

// 정상 대기 목록을 localStorage에 저장 (새로고침해도 목록이 사라지지 않도록)
function savePendingListToStorage() {
  localStorage.setItem(STORAGE_KEY_NORMAL_LIST, JSON.stringify(pendingNormalList));
}

// 앱을 처음 열 때 localStorage에 저장돼있던 목록을 불러오는 함수
function loadPendingListFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NORMAL_LIST);
    pendingNormalList = saved ? JSON.parse(saved) : [];
  } catch (err) {
    pendingNormalList = [];
  }
}

// 상단 상태바의 "정상 점검 대기: N건" 문구를 갱신
function renderNormalStatusBar() {
  document.getElementById("normalCountText").textContent = `정상 점검 대기: ${pendingNormalList.length}건`;
}

// 정상 대기 목록 화면 버튼들 설정
function setupNormalListButtons() {
  document.getElementById("viewNormalListBtn").addEventListener("click", () => {
    renderNormalListView();
    switchView("normalListView");
  });

  document.getElementById("closeNormalListBtn").addEventListener("click", () => {
    switchView("formView");
  });

  document.getElementById("sendNormalListBtn").addEventListener("click", () => {
    sendNormalListBatch();
  });
}

// 정상 대기 목록 화면에 항목들을 하나씩 그려주는 함수
function renderNormalListView() {
  const container = document.getElementById("normalListContent");
  container.innerHTML = "";

  if (pendingNormalList.length === 0) {
    container.innerHTML = '<p class="empty-list-msg">아직 추가된 정상 점검 항목이 없습니다.</p>';
    return;
  }

  pendingNormalList.forEach((entry, index) => {
    const item = document.createElement("div");
    item.className = "normal-list-item";

    const textWrap = document.createElement("div");
    textWrap.className = "item-text";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = `${index + 1}. ${entry.siteCategory} - ${entry.siteSubLocation}`;
    textWrap.appendChild(title);

    const sub = document.createElement("div");
    sub.className = "item-sub";
    sub.textContent = `${entry.acLocation} (${entry.acSpec})` + (entry.materials ? ` · 자재: ${entry.materials}` : "");
    textWrap.appendChild(sub);

    item.appendChild(textWrap);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "item-delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => {
      pendingNormalList.splice(index, 1);
      savePendingListToStorage();
      renderNormalStatusBar();
      renderNormalListView();
    });
    item.appendChild(deleteBtn);

    container.appendChild(item);
  });
}


function showConfirmScreen() {
  const confirmContent = document.getElementById("confirmContent");
  confirmContent.innerHTML = "";

  appendConfirmRow(confirmContent, "위치(대분류)", document.getElementById("siteCategory").value);
  appendConfirmRow(confirmContent, "위치2(소분류)", getSubLocationValue());

  CONFIRM_FIELD_LIST.forEach((field) => {
    const el = document.getElementById(field.id);
    let value = el.value.trim();
    if (!value) return; // 값이 없는 항목(필요한 자재 등)은 확인화면에서 생략

    const row = document.createElement("div");
    row.className = "confirm-row";

    const labelEl = document.createElement("span");
    labelEl.className = "c-label";
    labelEl.textContent = field.label;

    const valueEl = document.createElement("span");
    valueEl.className = "c-value";
    valueEl.textContent = value;

    if (field.id === "abnormalFlag") {
      valueEl.classList.add(value === "이상" ? "tag-abnormal" : "tag-normal");
    }

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    confirmContent.appendChild(row);
  });

  // 첨부 사진 표시
  if (attachedPhotos.length > 0) {
    const photoRow = document.createElement("div");
    photoRow.className = "confirm-row";
    photoRow.style.display = "block";

    const label = document.createElement("div");
    label.className = "c-label";
    label.textContent = "첨부 사진";
    photoRow.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "confirm-photo-grid";
    attachedPhotos.forEach((photo) => {
      const img = document.createElement("img");
      img.src = photo.dataUrl;
      grid.appendChild(img);
    });
    photoRow.appendChild(grid);

    confirmContent.appendChild(photoRow);
  }

  switchView("confirmView");
}


/* =========================================================
   6. 확인 화면의 버튼 동작 (수정하기 / 텔레그램 전송 / 새 점검 작성)
   ========================================================= */
function setupConfirmScreenButtons() {
  document.getElementById("editBtn").addEventListener("click", () => {
    switchView("formView"); // 입력했던 내용은 그대로 남아있는 상태로 돌아감
  });

  document.getElementById("finalSubmitBtn").addEventListener("click", () => {
    sendToTelegram();
  });

  document.getElementById("continueBtn").addEventListener("click", () => {
    resetForm({ keepChecker: true });
    switchView("formView");
  });
}

// 화면 4개(입력/확인/정상목록/완료) 중 하나만 보이도록 전환하는 함수
function switchView(viewId) {
  ["formView", "confirmView", "normalListView", "doneView"].forEach((id) => {
    document.getElementById(id).style.display = id === viewId ? "block" : "none";
  });
  window.scrollTo(0, 0);
}


/* =========================================================
   7. 텔레그램으로 전송
   ========================================================= */
async function sendToTelegram() {
  // 설정값이 채워져 있는지 먼저 확인
  if (TELEGRAM_BOT_TOKEN.includes("여기에") || TELEGRAM_CHAT_ID.includes("여기에")) {
    alert("텔레그램 봇 토큰과 채팅방 ID가 아직 설정되지 않았습니다.\nscript.js 상단의 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID를 먼저 입력해주세요.");
    return;
  }

  const finalSubmitBtn = document.getElementById("finalSubmitBtn");
  const editBtn = document.getElementById("editBtn");
  finalSubmitBtn.disabled = true;
  editBtn.disabled = true;
  finalSubmitBtn.textContent = "전송 중...";

  try {
    await sendTelegramMessage(buildReportText());

    // 사진이 있으면 순서대로 전송 (여러 장이면 번호를 붙여 구분)
    for (let i = 0; i < attachedPhotos.length; i++) {
      const caption = attachedPhotos.length > 1
        ? `점검 사진 ${i + 1}/${attachedPhotos.length}`
        : "점검 사진";
      await sendTelegramPhoto(attachedPhotos[i].file, caption);
    }

    switchView("doneView");
  } catch (err) {
    console.error(err);
    alert("텔레그램 전송에 실패했습니다.\n인터넷(와이파이) 연결과 봇 토큰/채팅방 ID를 확인해주세요.\n\n오류 내용: " + err.message);
  } finally {
    finalSubmitBtn.disabled = false;
    editBtn.disabled = false;
    finalSubmitBtn.textContent = "텔레그램으로 전송";
  }
}

// 점검 내용을 하나의 텍스트 메시지로 정리하는 함수
function buildReportText() {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} `
    + `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const checkerName = document.getElementById("checkerName").value.trim();
  const siteCategory = document.getElementById("siteCategory").value.trim();
  const siteSubLocation = getSubLocationValue();
  const acLocation = document.getElementById("acLocation").value.trim();
  const acSpec = document.getElementById("acSpec").value.trim();
  const abnormalFlag = document.getElementById("abnormalFlag").value.trim();
  const abnormalDetail = document.getElementById("abnormalDetail").value.trim();
  const materials = document.getElementById("materials").value.trim();

  let text = "[MCC 에어컨 점검 보고]\n";
  text += `점검일시: ${timestamp}\n`;
  text += `점검자: ${checkerName}\n`;
  text += `위치(대분류): ${siteCategory}\n`;
  text += `위치2(소분류): ${siteSubLocation}\n`;
  text += `에어컨 위치: ${acLocation}\n`;
  text += `에어컨 규격: ${acSpec}\n`;
  text += `이상 유무: ${abnormalFlag}\n`;
  text += `이상 내용: ${abnormalDetail ? abnormalDetail : "-"}\n`;
  text += `필요한 자재: ${materials ? materials : "없음"}`;

  return text;
}

// 텔레그램 sendMessage API 호출 (텍스트 전송)
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || "메시지 전송 실패");
  }
}

// 텔레그램 sendPhoto API 호출 (사진 전송)
async function sendTelegramPhoto(file, caption) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT_ID);
  formData.append("caption", caption);
  formData.append("photo", file);

  const response = await fetch(url, { method: "POST", body: formData });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || "사진 전송 실패");
  }
}


/* =========================================================
   7-1. 정상 대기 목록 일괄 전송
   ========================================================= */
async function sendNormalListBatch() {
  if (pendingNormalList.length === 0) {
    alert("전송할 정상 점검 항목이 없습니다.");
    return;
  }

  if (TELEGRAM_BOT_TOKEN.includes("여기에") || TELEGRAM_CHAT_ID.includes("여기에")) {
    alert("텔레그램 봇 토큰과 채팅방 ID가 아직 설정되지 않았습니다.\nscript.js 상단의 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID를 먼저 입력해주세요.");
    return;
  }

  const sendBtn = document.getElementById("sendNormalListBtn");
  sendBtn.disabled = true;
  sendBtn.textContent = "전송 중...";

  try {
    await sendTelegramMessage(buildNormalListReportText());
    alert(`정상 점검 ${pendingNormalList.length}건이 텔레그램으로 전송되었습니다.`);

    pendingNormalList = [];
    savePendingListToStorage();
    renderNormalStatusBar();
    switchView("formView");
  } catch (err) {
    console.error(err);
    alert("일괄 전송에 실패했습니다.\n인터넷(와이파이) 연결과 봇 토큰/채팅방 ID를 확인해주세요.\n\n오류 내용: " + err.message);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "일괄 전송";
  }
}

// 정상 대기 목록 전체를 하나의 텍스트 메시지로 정리하는 함수
function buildNormalListReportText() {
  const checkerName = document.getElementById("checkerName").value.trim() || "-";
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let text = "[MCC 에어컨 정상 점검 일괄 보고]\n";
  text += `점검일자: ${dateStr}\n`;
  text += `점검자: ${checkerName}\n`;
  text += `총 ${pendingNormalList.length}개소 정상 확인\n\n`;

  pendingNormalList.forEach((entry, index) => {
    text += `${index + 1}) ${entry.siteCategory} - ${entry.siteSubLocation} / ${entry.acLocation} (${entry.acSpec})`;
    if (entry.materials) text += ` · 자재: ${entry.materials}`;
    text += "\n";
  });

  return text.trim();
}


/* =========================================================
   8. 새 점검을 시작할 때 폼을 초기 상태로 되돌리는 함수
   ========================================================= */
// options.keepChecker가 true이면 점검자 선택값은 그대로 두고 나머지만 초기화합니다.
function resetForm(options = {}) {
  const keepChecker = options.keepChecker === true;
  const checkerSelect = document.getElementById("checkerName");
  const savedChecker = checkerSelect.value;

  document.getElementById("checkForm").reset();

  if (keepChecker) {
    checkerSelect.value = savedChecker;
  }

  updateSubLocationField(); // 위치(대분류)가 초기화된 상태에 맞춰 소분류 영역도 숨김 처리

  document.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".btn-group").forEach((group) => {
    document.getElementById(group.dataset.group).value = "";
  });

  document.getElementById("abnormalDetailField").style.display = "none";
  document.getElementById("photoField").style.display = "none";

  attachedPhotos = [];
  renderPhotoPreview();
}
