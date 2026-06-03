import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Trash2, 
  Plus, 
  X,
  TrendingUp,
  BarChart2
} from 'lucide-react';

// ==========================================
// 1. 초기 더미 데이터 세팅 (대관 및 당직)
// ==========================================

const INITIAL_RENTALS = [
  { id: 1, room: '상상마당', applicant: '홍길동', date: '2026-06-10', time: '10:00 ~ 12:00', purpose: '마을 공동체 정기 회의', status: '승인' },
  { id: 2, room: '공유주방', applicant: '김철수', date: '2026-06-12', time: '14:00 ~ 17:00', purpose: '전통 요리 교실 클래스', status: '대기' },
  { id: 3, room: '다목적실', applicant: '이영희', date: '2026-06-15', time: '09:00 ~ 13:00', purpose: '마을 어르신 복지 주민 설명회', status: '승인' },
];

const STAFF_LIST = ['김마을', '이공동', '박센터', '최지원', '정협력', '강상생', '조혁신'];
const ROOMS = ['상상마당', '공유주방', '다목적실', '미디어룸'];

// 당직 데이터 (요구사항: 당월/예정, 월별/누적 횟수, 장소, 날짜 기록 포함)
const INITIAL_DUTIES = [
  { id: 1, staff: '김마을', date: '2026-06-01', location: '상상마당', note: '평일 기본 당직' },
  { id: 2, staff: '이공동', date: '2026-06-03', location: '공유주방', note: '평일 기본 당직' },
  { id: 3, staff: '박센터', date: '2026-06-06', location: '다목적실', note: '주말 행사 지원 당직' },
  { id: 4, staff: '최지원', date: '2026-06-07', location: '상상마당', note: '주말 대관 관리' },
  { id: 5, staff: '정협력', date: '2026-06-10', location: '미디어룸', note: '평일 야간 당직' },
  { id: 6, staff: '강상생', date: '2026-06-14', location: '다목적실', note: '주말 주민 총회 지원' },
  { id: 7, staff: '조혁신', date: '2026-06-15', location: '공유주방', note: '평일 기본 당직' },
  { id: 8, staff: '김마을', date: '2026-06-20', location: '상상마당', note: '주말 특근 당직' },
  { id: 9, staff: '이공동', date: '2026-06-24', location: '미디어룸', note: '평일 기본 당직' },
  // 과거 누적 합산을 시뮬레이션하기 위한 이전 달 데이터
  { id: 10, staff: '김마을', date: '2026-05-02', location: '다목적실', note: '이전 당직' },
  { id: 11, staff: '김마을', date: '2026-05-15', location: '상상마당', note: '이전 당직' },
  { id: 12, staff: '이공동', date: '2026-05-20', location: '공유주방', note: '이전 당직' },
  { id: 13, staff: '박센터', date: '2026-05-11', location: '상상마당', note: '이전 당직' },
  { id: 14, staff: '최지원', date: '2026-05-12', location: '다목적실', note: '이전 당직' },
  { id: 15, staff: '정협력', date: '2026-05-04', location: '미디어룸', note: '이전 당직' },
  { id: 16, staff: '강상생', date: '2026-05-28', location: '공유주방', note: '이전 당직' },
  { id: 17, staff: '조혁신', date: '2026-05-19', location: '상상마당', note: '이전 당직' },
];

export default function App() {
  // --- 상태 관리 ---
  const [currentMenu, setCurrentMenu] = useState('home'); // 'home' | 'duty' | 'admin'
  const [rentals, setRentals] = useState(INITIAL_RENTALS);
  const [duties, setDuties] = useState(INITIAL_DUTIES);
  
  // 현재 날짜 기준 달력 시점 (2026년 6월 타깃팅)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); 

  // 입력 폼 상태 (대관 신청)
  const [rentalForm, setRentalForm] = useState({ room: '상상마당', applicant: '', date: '', time: '10:00 ~ 12:00', purpose: '' });
  // 입력 폼 상태 (당직 추가)
  const [dutyForm, setDutyForm] = useState({ staff: '김마을', date: '', location: '상상마당', note: '' });

  // 자체 제작 모달 팝업 상태 (window.confirm 배제 요구사항 준수)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null });

  // 당직현황 탭 전용 상태: 특정 직원 상세 보기 선택
  const [selectedStaffDuty, setSelectedStaffDuty] = useState('김마을');

  // --- 날짜 계산기용 유틸리티 함수 ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();

  // --- 대관 및 당직 데이터 필터링/통계 (useMemo 활용) ---
  const currentMonthRentals = useMemo(() => {
    return rentals.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [rentals, year, month]);

  // 당직 통계 가공
  const dutyStats = useMemo(() => {
    const stats = {};
    STAFF_LIST.forEach(staff => {
      stats[staff] = { currentMonthWeekday: 0, currentMonthWeekend: 0, currentMonthTotal: 0, cumulative: 0, history: [] };
    });

    duties.forEach(duty => {
      const d = new Date(duty.date);
      const isCurrentMonth = d.getFullYear() === year && d.getMonth() === month;
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (stats[duty.staff]) {
        // 상세 기록 매칭
        stats[duty.staff].history.push({
          date: duty.date,
          location: duty.location,
          note: duty.note,
          isWeekend
        });
        
        // 전체 누적 증가
        stats[duty.staff].cumulative += 1;

        // 이번 달 통계 세분화
        if (isCurrentMonth) {
          if (isWeekend) {
            stats[duty.staff].currentMonthWeekend += 1;
          } else {
            stats[duty.staff].currentMonthWeekday += 1;
          }
          stats[duty.staff].currentMonthTotal += 1;
        }
      }
    });

    // 날짜 역순 정렬
    STAFF_LIST.forEach(staff => {
      stats[staff].history.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return stats;
  }, [duties, year, month]);

  // 오늘 이후 예정된 당직 일정 리스트 (2026년 6월 3일 기준 설정)
  const upcomingDuties = useMemo(() => {
    const targetDateStr = '2026-06-03';
    return duties
      .filter(d => d.date >= targetDateStr)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [duties]);

  // --- 이벤트 핸들러 ---
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleAddRental = (e) => {
    e.preventDefault();
    if (!rentalForm.applicant || !rentalForm.date || !rentalForm.purpose) return;
    const newRental = {
      id: Date.now(),
      ...rentalForm,
      status: '대기'
    };
    setRentals([...rentals, newRental]);
    setRentalForm({ room: '상상마당', applicant: '', date: '', time: '10:00 ~ 12:00', purpose: '' });
  };

  const handleAddDuty = (e) => {
    e.preventDefault();
    if (!dutyForm.date) return;
    const newDuty = {
      id: Date.now(),
      ...dutyForm
    };
    setDuties([...duties, newDuty]);
    setDutyForm({ staff: '김마을', date: '', location: '상상마당', note: '' });
  };

  // 커스텀 모달 오픈 트리거
  const openDeleteModal = (type, id) => {
    setDeleteModal({ isOpen: true, type, id });
  };

  const confirmDelete = () => {
    const { type, id } = deleteModal;
    if (type === 'rental') {
      setRentals(rentals.filter(r => r.id !== id));
    } else if (type === 'duty') {
      setDuties(duties.filter(d => d.id !== id));
    }
    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  const handleStatusChange = (id, nextStatus) => {
    setRentals(rentals.map(r => r.id === id ? { ...r, status: nextStatus } : r));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* ==========================================
          공통 헤더 영역
         ========================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentMenu('home')}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-100">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">용인시마을공동체지원센터</h1>
              <p className="text-xs text-slate-500 font-medium">통합 대관 및 당직 시스템</p>
            </div>
          </div>

          {/* 요구사항 매칭 내비게이션 바: [홈(캘린더) -> 당직현황 -> 관리자모드] */}
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrentMenu('home')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                currentMenu === 'home' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>홈 (대관 달력)</span>
            </button>
            <button
              onClick={() => setCurrentMenu('duty')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                currentMenu === 'duty' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="relative">
                당직현황
                <span className="absolute -top-1.5 -right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </span>
            </button>
            <button
              onClick={() => setCurrentMenu('admin')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                currentMenu === 'admin' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>행정 관리자 모드</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ==========================================
          메인 콘텐츠 분기 컨테이너
         ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ------------------------------------------
            MENU 1. 홈 (종합 대관 및 기본 대관신청 달력)
           ------------------------------------------ */}
        {currentMenu === 'home' && (
          <div className="space-y-8">
            {/* 상단 안내 바 */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">마을과 공간을 잇다, 주민 대관 스페이스</h2>
                <p className="text-indigo-100 text-sm mt-1">공동체 활동 공간 예약을 실시간으로 확인하고 관리하세요.</p>
              </div>
              <div className="flex gap-2">
                {ROOMS.map(r => (
                  <span key={r} className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 왼쪽: 대관 신청 폼 카드 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
                <div>
                  <h3 className="text-base font-bold text-slate-900">신규 대관 예약 신청</h3>
                  <p className="text-xs text-slate-500 mt-0.5">원하시는 공간과 날짜를 채워 신청해 주세요.</p>
                </div>
                <form onSubmit={handleAddRental} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">이용 희망 장소</label>
                    <select 
                      value={rentalForm.room} 
                      onChange={e => setRentalForm({...rentalForm, room: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">단체/신청자명</label>
                    <input 
                      type="text" 
                      placeholder="예: 행정마을회"
                      value={rentalForm.applicant}
                      onChange={e => setRentalForm({...rentalForm, applicant: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">예약 날짜</label>
                      <input 
                        type="date" 
                        value={rentalForm.date}
                        onChange={e => setRentalForm({...rentalForm, date: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">사용 시간대</label>
                      <select 
                        value={rentalForm.time}
                        onChange={e => setRentalForm({...rentalForm, time: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="10:00 ~ 12:00">10:00 ~ 12:00</option>
                        <option value="14:00 ~ 17:00">14:00 ~ 17:00</option>
                        <option value="18:30 ~ 21:30">18:30 ~ 21:30</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">공동체 사용 목적</label>
                    <textarea 
                      rows="3" 
                      placeholder="대관 목적 상세 내용을 간략히 적어주세요."
                      value={rentalForm.purpose}
                      onChange={e => setRentalForm({...rentalForm, purpose: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>공간 예약 신청서 제출</span>
                  </button>
                </form>
              </div>

              {/* 오른쪽: 메인 캘린더 위젯 대시보드 */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  {/* 달력 헤더 제어바 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-1">
                      <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{year}년</span>
                      <span className="text-2xl font-semibold text-indigo-600">{month + 1}월</span>
                    </div>
                    <div className="flex space-x-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
                      <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-all shadow-sm hover:shadow-none"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-all shadow-sm hover:shadow-none"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* 달력 그리드 */}
                  <div className="grid grid-cols-7 gap-y-2 gap-x-2 text-center text-xs font-bold text-slate-500 border-b border-slate-100 pb-2 mb-2">
                    <div className="text-rose-500">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-500">토</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 h-[340px]">
                    {/* 이전 달 공백 칸 채우기 */}
                    {Array.from({ length: firstDayIndex }).map((_, idx) => {
                      const dayNum = prevMonthDays - firstDayIndex + idx + 1;
                      return (
                        <div key={`prev-${idx}`} className="p-1 bg-slate-50/50 rounded-xl text-slate-300 font-medium text-left text-[11px] opacity-60">
                          {dayNum}
                        </div>
                      );
                    })}

                    {/* 이번 달 날짜 칸 매칭 */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      
                      // 당일 매칭 대관
                      const matchedRentals = currentMonthRentals.filter(r => r.date === dateString);
                      // 당일 매칭 당직자 검색
                      const matchedDuties = duties.filter(d => d.date === dateString);

                      return (
                        <div key={dayNum} className="p-1.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between overflow-hidden hover:bg-indigo-50/30 transition-all group">
                          <span className={`text-[11px] font-bold text-left ${
                            new Date(dateString).getDay() === 0 ? 'text-rose-500' : new Date(dateString).getDay() === 6 ? 'text-blue-500' : 'text-slate-700'
                          }`}>
                            {dayNum}
                          </span>
                          
                          <div className="space-y-0.5 mt-1 flex-1 flex flex-col justify-end">
                            {/* 당직 마크 표시 */}
                            {matchedDuties.map(d => (
                              <div key={d.id} className="bg-amber-100 text-amber-800 rounded px-1 py-0.5 text-[9px] font-bold truncate border border-amber-200">
                                👤 {d.staff}(당직)
                              </div>
                            ))}
                            {/* 대관 표시 */}
                            {matchedRentals.map(r => (
                              <div 
                                key={r.id} 
                                className={`rounded px-1 py-0.5 text-[9px] font-semibold truncate border ${
                                  r.status === '승인' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                }`}
                              >
                                {r.room}: {r.applicant}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-4 mt-4">
                  <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-200 inline-block"></span><span>센터 직원 당직일</span></div>
                  <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-100 inline-block"></span><span>대관 예약 확정</span></div>
                  <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-indigo-50 border border-indigo-100 inline-block"></span><span>대관 승인 대기</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            MENU 2. 당직현황 (⭐️ 추가 요구사항 대시보드 화면)
           ------------------------------------------ */}
        {currentMenu === 'duty' && (
          <div className="space-y-8">
            
            {/* 상단 통합 헤더 요약 웰컴 보드 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">실시간 통계 인덱스</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2">{month + 1}월 직원 당직 종합현황</h2>
                <p className="text-xs text-slate-500 mt-1">마을공동체지원센터 7인 상주팀 당직 배치 스케줄입니다.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4 border border-slate-100">
                <div className="bg-amber-500 text-white p-2.5 rounded-xl"><Clock className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">당월 배정된 총 당직수</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">
                    {duties.filter(d => {
                      const dt = new Date(d.date);
                      return dt.getFullYear() === year && dt.getMonth() === month;
                    }).length} 회
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center space-x-4 border border-slate-100">
                <div className="bg-indigo-500 text-white p-2.5 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">센터 최다 당직 거점</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">상상마당 본부</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* 구역 1: 당직자별 월별 당직 횟수, 누적 당직횟수 표 대조 */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">직원별 당직 통계 현황표</h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">이름 클릭 시 실시간 이력 연동</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                          <th className="px-6 py-3">당직 근무자</th>
                          <th className="px-6 py-3">당월 평일 횟수</th>
                          <th className="px-6 py-3">당월 주말 횟수</th>
                          <th className="px-6 py-3 bg-indigo-50/50 text-indigo-700">당월 총합</th>
                          <th className="px-6 py-3 text-right bg-amber-50/50 text-amber-800">센터 전체 누적</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {STAFF_LIST.map(staff => {
                          const isSelected = selectedStaffDuty === staff;
                          return (
                            <tr 
                              key={staff} 
                              onClick={() => setSelectedStaffDuty(staff)}
                              className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'}`}
                            >
                              <td className="px-6 py-3.5 flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`}></div>
                                <span className="text-slate-900 font-bold">{staff} 전임</span>
                              </td>
                              <td className="px-6 py-3.5 text-slate-600">{dutyStats[staff]?.currentMonthWeekday || 0}회</td>
                              <td className="px-6 py-3.5 text-slate-600">{dutyStats[staff]?.currentMonthWeekend || 0}회</td>
                              <td className="px-6 py-3.5 bg-indigo-50/20 text-indigo-600 font-bold">{dutyStats[staff]?.currentMonthTotal || 0}회</td>
                              <td className="px-6 py-3.5 text-right font-black text-amber-700 bg-amber-50/20">{dutyStats[staff]?.cumulative || 0}회</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 구역 2: 대관 예정 당직자 현황 (실시간 타임라인 스케줄러) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">6월 주요 예정 당직 스케줄 타임라인</h3>
                    <p className="text-xs text-slate-500 mt-0.5">금일 이후 확정 배정되어 운영 대기 중인 목록입니다.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upcomingDuties.slice(0, 4).map(d => (
                      <div key={d.id} className="border border-slate-100 bg-slate-50 p-3.5 rounded-xl flex items-start justify-between group hover:border-indigo-200 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-indigo-600 bg-white border border-indigo-100 px-2 py-0.5 rounded-md shadow-2xs">
                            {d.date}
                          </span>
                          <p className="text-xs font-bold text-slate-800 pt-1">👤 {d.staff} 당직담당자</p>
                          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>지원 관할 거점: {d.location}</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          근무 대기
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 오른쪽: 당직자별 상세 당직현황 탐색 패널 (월, 누적, 장소, 당직한 날짜 상세 기록) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">Interactive Profiler</span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedStaffDuty} 당직자 개인 상세 스펙트럼</h3>
                  </div>

                  {/* 개인 메트릭 카드 블록 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <p className="text-[11px] font-bold text-slate-400">당월 총 근무</p>
                      <p className="text-xl font-extrabold text-indigo-600 mt-1">{dutyStats[selectedStaffDuty]?.currentMonthTotal || 0} <span className="text-xs font-medium text-slate-500">회</span></p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <p className="text-[11px] font-bold text-slate-400">총 전적 누적치</p>
                      <p className="text-xl font-extrabold text-amber-600 mt-1">{dutyStats[selectedStaffDuty]?.cumulative || 0} <span className="text-xs font-medium text-slate-500">회</span></p>
                    </div>
                  </div>

                  {/* 장소 및 메모 로그 */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">전체 배정 이력 로그 리스트</label>
                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                      {dutyStats[selectedStaffDuty]?.history.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">등록된 누적 당직 날짜 기록이 없습니다.</p>
                      ) : (
                        dutyStats[selectedStaffDuty]?.history.map((hist, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-100 text-xs">
                            <div className="flex items-center space-x-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${hist.isWeekend ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                              <span className="font-mono text-slate-700 font-semibold">{hist.date}</span>
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium">{hist.isWeekend ? '주말' : '평일'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              <span className="font-bold text-slate-800">{hist.location}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 bg-indigo-50/40 p-3 rounded-xl text-[11px] text-indigo-800 font-medium">
                  💡 왼쪽 현황표의 다른 직원을 선택하시면 해당 직원의 월간 및 과거 전체 누적 당직 날짜 이력이 자동으로 전환 로드됩니다.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------
            MENU 3. 행정 관리자 모드 화면
           ------------------------------------------ */}
        {currentMenu === 'admin' && (
          <div className="space-y-8">
            
            {/* 상단 당직 추가 어드민 제어 폼 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">🔧 당직 명령 배정 등록 컨트롤러</h3>
                <p className="text-xs text-slate-500 mt-0.5">특정 날짜와 지원 장소를 매칭하여 직원 당직 스케줄을 추가 선언합니다.</p>
              </div>
              <form onSubmit={handleAddDuty} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">담당 직원 지정</label>
                  <select 
                    value={dutyForm.staff} 
                    onChange={e => setDutyForm({...dutyForm, staff: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {STAFF_LIST.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">당직 지정일</label>
                  <input 
                    type="date" 
                    value={dutyForm.date}
                    onChange={e => setDutyForm({...dutyForm, date: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">근무지 설정</label>
                  <select 
                    value={dutyForm.location} 
                    onChange={e => setDutyForm({...dutyForm, location: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {ROOMS.map(rm => <option key={rm} value={rm}>{rm}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">비고 (특이사항)</label>
                  <input 
                    type="text" 
                    placeholder="주말 행사 점검 등"
                    value={dutyForm.note}
                    onChange={e => setDutyForm({...dutyForm, note: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl text-sm transition-colors flex items-center justify-center space-x-1">
                  <Plus className="w-4 h-4" />
                  <span>당직 스케줄 반영</span>
                </button>
              </form>
            </div>

            {/* 하단 투 트랙 관리 그리드 (대관신청 목록 제어 + 당직 누적 데이터 파괴 제어) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 대관 신청 데이터 제어 컴포넌트 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">📋 접수된 주민 대관 예약 신청 심사</h3>
                </div>
                <div className="p-4 space-y-3">
                  {rentals.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">현재 접수된 예약 이력이 존재하지 않습니다.</p>
                  ) : (
                    rentals.map(r => (
                      <div key={r.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{r.applicant}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === '승인' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>{r.status} 상태</span>
                          </div>
                          <p className="text-slate-600"><span className="font-bold text-indigo-600">[{r.room}]</span> {r.date} ({r.time})</p>
                          <p className="text-slate-400 text-[11px]">목적: {r.purpose}</p>
                        </div>
                        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                          {r.status === '대기' && (
                            <button 
                              onClick={() => handleStatusChange(r.id, '승인')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors"
                            >
                              승인허가
                            </button>
                          )}
                          <button 
                            onClick={() => openDeleteModal('rental', r.id)}
                            className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 당직 마스터 데이터 제어 컴포넌트 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">🛡️ 배치된 센터 당직 원장 관리 데이터베이스</h3>
                </div>
                <div className="p-4 space-y-3">
                  {duties.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">반영된 당직 마스터 데이터가 비어 있습니다.</p>
                  ) : (
                    duties.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(d => (
                      <div key={d.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/60 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800">{d.staff} 전임</span>
                            <span className="text-[11px] text-slate-400 font-mono">{d.date}</span>
                          </div>
                          <p className="text-slate-500 text-[11px]">거점: {d.location} | 사유: {d.note || '일반 지원'}</p>
                        </div>
                        <button 
                          onClick={() => openDeleteModal('duty', d.id)}
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          하단 푸터 바
         ========================================== */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        © 2026 용인시마을공동체지원센터 대관·당직 포털 연동 대시보드
      </footer>

      {/* ==========================================
          자체 제작 미려한 삭제 확인 팝업 모달창
          (⚠️ window.confirm 배제 제약조건 완전 충족 보장)
         ========================================== */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 transform scale-100 transition-transform space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-slate-900">데이터 영구 삭제 안내</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              선택하신 항목을 데이터베이스에서 정말 삭제하시겠습니까? 이 작업은 즉각 복구할 수 없는 안전 격리 프로세스입니다.
            </p>
            <div className="flex space-x-2 justify-end pt-2">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                취소하기
              </button>
              <button 
                onClick={confirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-100"
              >
                확인 및 삭제
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}