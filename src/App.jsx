import { useMemo, useState } from "react";
import ChartCard from "./components/ChartCard.jsx";
import ChartTabsMobile from "./components/ChartTabsMobile.jsx";
import TimeTabs from "./components/TimeTabs.jsx";
import chartMock from "../mock_chart_multi.json";
import cardsNow from "../mock_cards_now.json";
import cardsHistoryPage1 from "../mock_cards_history_page1.json";

function App() {
  const [activeTab, setActiveTab] = useState("pressure");
  const [range, setRange] = useState(15); // 15, 30, 45, 60 минут
  const [circuit, setCircuit] = useState("Контур A");

  const charts = {
    pressure: {
      title: "Напор воды",
      color: "#3b82f6",
      series: [
        {
          name: "Расход",
          data: chartMock.series[0].points.map(
            (p) => Math.round(p.value * 10000) / 100
          ),
        },
      ],
    },
    temperature: {
      title: "Температура",
      color: "#ef4444",
      series: [
        {
          name: "Температура",
          data: [18, 19, 21, 22, 24, 25, 24, 23, 22, 21, 20, 19],
        },
      ],
    },
    sensors: {
      title: "Датчики давления",
      color: "#10b981",
      series: [
        {
          name: "Срабатывания",
          data: [1, 2, 3, 2, 4, 3, 5, 4, 3, 2, 4, 5],
        },
      ],
    },
  };

  const baseCategories = chartMock.series[0].points.map((p) => {
    const d = new Date(p.ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  });

  const rangesToPoints = { 15: 5, 30: 7, 45: 9, 60: 12 };

  const timeCategories = useMemo(() => {
    const points = rangesToPoints[range] || 5;
    return baseCategories.slice(0, points);
  }, [range]);

  const currentChart = useMemo(() => {
    const cfg = charts[activeTab];
    const points = rangesToPoints[range] || 5;
    const circuitShift =
      circuit === "Контур B" ? 5 : circuit === "Контур C" ? -5 : 0;
    const sliced = cfg.series.map((s) => ({
      ...s,
      data: s.data.slice(0, points).map((v) => v + circuitShift),
    }));
    return { ...cfg, series: sliced };
  }, [activeTab, range, circuit]);

  // Cards data based on range and circuit
  const nowMap = useMemo(() => {
    const map = new Map();
    cardsNow.forEach((item) => map.set(item.title, item));
    return map;
  }, []);

  const historyByTitle = useMemo(() => {
    const by = new Map();
    if (cardsHistoryPage1?.items) {
      cardsHistoryPage1.items.forEach((it) => {
        if (!by.has(it.title)) by.set(it.title, []);
        by.get(it.title).push(it);
      });
      // newest first
      for (const [, arr] of by)
        arr.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    }
    return by;
  }, []);

  const selectedCard = useMemo(() => {
    if (range === "now") return nowMap.get(circuit);
    const arr = historyByTitle.get(circuit);
    if (!arr || arr.length === 0) return nowMap.get(circuit);
    // pick the first Nth depending on range to simulate different slices
    const idx = Math.min((rangesToPoints[range] || 1) - 1, arr.length - 1);
    return arr[idx];
  }, [range, circuit, nowMap, historyByTitle]);

  const stateTitle = useMemo(() => {
    if (range === "now") return "Текущее состояние";
    if (range === 60) return "Состояние 1 час назад";
    return `Состояние ${range} минут назад`;
  }, [range]);
  return (
    <div className="min-h-screen bg-gray-100 p-6 sm:p-6">
      {/* Заголовок */}
      <h1
        className="text-5xl sm:text-5xl mb-12 sm:mb-12 text-center font-bold text-black sm:text-5xl"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
      >
        Система мониторинга
      </h1>

      {/* Панель: время + контур по центру */}
      <div className="flex flex-col md:flex-row justify-center items-stretch md:items-center gap-2 sm:gap-4 mb-4 sm:mb-8 px-2">
        <TimeTabs value={range} onChange={setRange} />
        <select
          value={circuit}
          onChange={(e) => setCircuit(e.target.value)}
          className="bg-white ring-1 ring-gray-200 text-black rounded-xl text-sm sm:text-base font-medium px-3 sm:px-4 h-12 shadow-sm md:w-auto w-full"
          style={{ fontFamily: "Helvetica Neue, sans-serif" }}
        >
          <option>Контур A</option>
          <option>Контур B</option>
          <option>Контур C</option>
        </select>
      </div>

      {/* Верхняя секция с двумя карточками */}
      <div className="flex flex-col md:flex-row justify-center gap-4 sm:gap-10 mb-6 sm:mb-10 px-2">
        {/* Белая карточка */}
        <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 w-full md:w-[420px] min-h-[240px] sm:h-[260px] flex flex-col justify-between">
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-black"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              {stateTitle}
            </h2>
            <p
              className="mb-2 text-base sm:text-lg text-black"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              Важность: • {selectedCard?.importance || "Средняя"}
            </p>
            <p
              className="mb-2 text-base sm:text-lg text-black"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              Уверенность:{" "}
              {selectedCard?.confidence != null
                ? Math.round(selectedCard.confidence * 100) + "%"
                : "—"}
            </p>
            <p
              className="mt-4 sm:mt-6 text-base sm:text-lg text-black"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              Рекомендация: {selectedCard?.recommendation || "—"}
            </p>
          </div>
        </div>

        {/* Красная карточка */}
        <div className="bg-red-600 text-white shadow-lg rounded-2xl p-4 sm:p-6 w-full md:w-[420px] min-h-[240px] sm:h-[260px] flex flex-col justify-between">
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              {nowMap.get(circuit)?.alarm ||
                selectedCard?.alarm ||
                "Авария: падение давления"}
            </h2>
            <p
              className="text-base sm:text-lg mb-2"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              Важность: • {selectedCard?.importance || "Высокая"}
            </p>
            <p
              className="text-base sm:text-lg"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              AI прогноз:{" "}
              {selectedCard?.aiForecast
                ? Math.round(selectedCard.aiForecast.value * 100) +
                  "% " +
                  (selectedCard.aiForecast.note || "")
                : "—"}
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              className="px-5 sm:px-7 py-3 sm:py-3.5 bg-red-700 text-white rounded-xl hover:bg-red-800 text-base sm:text-lg font-medium w-full sm:w-auto"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              Правильно
            </button>
            <button
              className="px-5 sm:px-7 py-3 sm:py-3.5 bg-red-700 text-white rounded-xl hover:bg-red-800 text-base sm:text-lg font-medium w-full sm:w-auto"
              style={{ fontFamily: "Helvetica Neue, sans-serif" }}
            >
              Неправильно
            </button>
          </div>
        </div>
      </div>

      {/* Нижняя секция с графиком */}
      <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 w-full">
        {/* Mobile tabs styled like desktop */}
        <div className="mb-3 md:hidden">
          <ChartTabsMobile value={activeTab} onChange={setActiveTab} />
        </div>
        <ChartCard
          title={currentChart.title}
          series={currentChart.series}
          categories={timeCategories}
          color={currentChart.color}
          yUnit="л/мин"
          rightControls={
            <>
              {/* Табы справа */}
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setActiveTab("pressure")}
                  className={`${
                    activeTab === "pressure"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 hover:bg-blue-50 ring-1 ring-gray-200"
                  } px-5 py-2.5 rounded-xl text-base font-medium`}
                  style={{ fontFamily: "Helvetica Neue, sans-serif" }}
                >
                  Напор воды
                </button>
                <button
                  onClick={() => setActiveTab("temperature")}
                  className={`${
                    activeTab === "temperature"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 hover:bg-blue-50 ring-1 ring-gray-200"
                  } px-5 py-2.5 rounded-xl text-base font-medium`}
                  style={{ fontFamily: "Helvetica Neue, sans-serif" }}
                >
                  Температура
                </button>
                <button
                  onClick={() => setActiveTab("sensors")}
                  className={`${
                    activeTab === "sensors"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 hover:bg-blue-50 ring-1 ring-gray-200"
                  } px-5 py-2.5 rounded-xl text-base font-medium`}
                  style={{ fontFamily: "Helvetica Neue, sans-serif" }}
                >
                  Датчики давления
                </button>
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}

export default App;
