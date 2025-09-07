"use client";

import {
  Button,
  Card,
  Table,
  DatePicker,
  Select,
  Input,
  Space,
  Tag,
} from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthContext";

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [visibleStats, setVisibleStats] = useState({
    dailyTotal: false,
    dailyProfit: false,
    weeklyTotal: false,
    weeklyProfit: false,
  });
  const [dailyReports, setDailyReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, "days"),
    dayjs(),
  ]);
  const [searchText, setSearchText] = useState("");
  const [incomeFilter, setIncomeFilter] = useState(null);
  const [profitFilter, setProfitFilter] = useState(null);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Sample data - replace with actual API call
  const [stats, setStats] = useState({
    dailyTotal: 15000,
    dailyProfit: 3000,
    weeklyTotal: 85000,
    weeklyProfit: 17000,
  });

  // Fetch daily reports data
  useEffect(() => {
    if (user?.id) {
      fetchDailyReports();
    }
  }, [dateRange, user?.id]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...dailyReports];

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(
        (report) =>
          report.date.toLowerCase().includes(searchText.toLowerCase()) ||
          report.totalIncome.toString().includes(searchText) ||
          report.totalProfit.toString().includes(searchText)
      );
    }

    // Apply income filter
    if (incomeFilter) {
      filtered = filtered.filter((report) => {
        switch (incomeFilter) {
          case "high":
            return report.totalIncome > 20000;
          case "medium":
            return report.totalIncome >= 10000 && report.totalIncome <= 20000;
          case "low":
            return report.totalIncome < 10000;
          default:
            return true;
        }
      });
    }

    // Apply profit filter
    if (profitFilter) {
      filtered = filtered.filter((report) => {
        switch (profitFilter) {
          case "high":
            return report.totalProfit > 5000;
          case "medium":
            return report.totalProfit >= 2000 && report.totalProfit <= 5000;
          case "low":
            return report.totalProfit < 2000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  }, [
    dailyReports,
    searchText,
    incomeFilter,
    profitFilter,
    sortField,
    sortOrder,
  ]);

  const fetchDailyReports = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      // Include shopId in the request to filter data by shop
      const shopId = user?.id;
      const url = shopId
        ? `/api/reports?startDate=${startDate}&endDate=${endDate}&shopId=${shopId}`
        : `/api/reports?startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDailyReports(data.data.dailyReports);
          setFilteredReports(data.data.dailyReports);
          // Update stats with real data
          const summary = data.data.summary;
          setStats({
            dailyTotal: summary.averageDailyIncome,
            dailyProfit: summary.averageDailyProfit,
            weeklyTotal: summary.totalIncome,
            weeklyProfit: summary.totalProfit,
          });
        } else {
          throw new Error(data.error);
        }
      } else {
        throw new Error("Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching daily reports:", error);
      // Fallback to sample data
      const sampleData = generateSampleDailyData();
      setDailyReports(sampleData);
      setFilteredReports(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleDailyData = () => {
    const data = [];
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    const days = endDate.diff(startDate, "days") + 1;

    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, "days");
      const dailyIncome = Math.floor(Math.random() * 20000) + 5000;
      const houseCut = Math.floor(Math.random() * 20) + 10; // 10-30%
      const dailyProfit = Math.floor(dailyIncome * (houseCut / 100));

      data.push({
        key: i,
        date: date.format("YYYY-MM-DD"),
        dailyIncome,
        dailyProfit,
        houseCut,
        gamesPlayed: Math.floor(Math.random() * 50) + 10,
      });
    }
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        "Date",
        "Daily Income",
        "Daily Profit",
        "House Cut %",
        "Games Played",
        "Total Cards",
        "Completed Games",
      ],
      ...filteredReports.map((report) => [
        dayjs(report.date).format("YYYY-MM-DD"),
        report.totalIncome,
        report.totalProfit,
        report.houseCut,
        report.gamesPlayed,
        report.totalCards,
        report.completedGames || 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bingo-reports-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: true,
      render: (date) => (
        <div>
          <div className="font-medium">
            {dayjs(date).format("MMM DD, YYYY")}
          </div>
          <div className="text-xs text-gray-500">
            {dayjs(date).format("dddd")}
          </div>
        </div>
      ),
    },
    {
      title: "Daily Income",
      dataIndex: "totalIncome",
      key: "totalIncome",
      sorter: true,
      render: (amount) => (
        <div className="text-right">
          <div className="font-semibold text-blue-600">
            ETB {amount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: "Daily Profit",
      dataIndex: "totalProfit",
      key: "totalProfit",
      sorter: true,
      render: (amount) => (
        <div className="text-right">
          <div className="font-semibold text-green-600">
            ETB {amount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: "House Cut %",
      dataIndex: "houseCut",
      key: "houseCut",
      render: (cut) => (
        <Tag color={cut > 20 ? "red" : cut > 15 ? "orange" : "green"}>
          {cut}%
        </Tag>
      ),
    },
    {
      title: "Games Played",
      dataIndex: "gamesPlayed",
      key: "gamesPlayed",
      sorter: true,
      render: (count) => (
        <div className="text-center">
          <Tag color="blue">{count}</Tag>
        </div>
      ),
    },
    {
      title: "Total Cards",
      dataIndex: "totalCards",
      key: "totalCards",
      sorter: true,
      render: (count) => (
        <div className="text-center">
          <Tag color="purple">{count}</Tag>
        </div>
      ),
    },
    {
      title: "Completed Games",
      dataIndex: "completedGames",
      key: "completedGames",
      sorter: true,
      render: (count) => (
        <div className="text-center">
          <Tag color="green">{count}</Tag>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                className="mr-4"
              />
              <h1 className="text-2xl font-semibold text-gray-900">
                Reports Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Reports Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Daily Total */}
          <Card className="shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">Daily Total</h3>
              <Button
                type="text"
                icon={
                  visibleStats.dailyTotal ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() =>
                  setVisibleStats((prev) => ({
                    ...prev,
                    dailyTotal: !prev.dailyTotal,
                  }))
                }
              />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ETB{" "}
              {visibleStats.dailyTotal
                ? stats.dailyTotal.toLocaleString()
                : "****"}
            </p>
          </Card>

          {/* Daily Profit */}
          <Card className="shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Daily Profit
              </h3>
              <Button
                type="text"
                icon={
                  visibleStats.dailyProfit ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() =>
                  setVisibleStats((prev) => ({
                    ...prev,
                    dailyProfit: !prev.dailyProfit,
                  }))
                }
              />
            </div>
            <p className="text-2xl font-bold text-green-600">
              ETB{" "}
              {visibleStats.dailyProfit
                ? stats.dailyProfit.toLocaleString()
                : "****"}
            </p>
          </Card>

          {/* Weekly Total */}
          <Card className="shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Weekly Total
              </h3>
              <Button
                type="text"
                icon={
                  visibleStats.weeklyTotal ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() =>
                  setVisibleStats((prev) => ({
                    ...prev,
                    weeklyTotal: !prev.weeklyTotal,
                  }))
                }
              />
            </div>
            <p className="text-2xl font-bold text-orange-600">
              ETB{" "}
              {visibleStats.weeklyTotal
                ? stats.weeklyTotal.toLocaleString()
                : "****"}
            </p>
          </Card>

          {/* Weekly Profit */}
          <Card className="shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Weekly Profit
              </h3>
              <Button
                type="text"
                icon={
                  visibleStats.weeklyProfit ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() =>
                  setVisibleStats((prev) => ({
                    ...prev,
                    weeklyProfit: !prev.weeklyProfit,
                  }))
                }
              />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              ETB{" "}
              {visibleStats.weeklyProfit
                ? stats.weeklyProfit.toLocaleString()
                : "****"}
            </p>
          </Card>
        </div>

        {/* Daily Reports Table */}
        <div className="mt-8">
          <Card className="shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Daily Reports
              </h2>
              <div className="flex gap-4 items-center">
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  format="YYYY-MM-DD"
                  placeholder={["Start Date", "End Date"]}
                />
                <Button onClick={fetchDailyReports} loading={loading}>
                  Refresh
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportToCSV}
                  disabled={filteredReports.length === 0}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <SearchOutlined className="text-gray-500" />
                  <Input
                    placeholder="Search by date, income, or profit..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                  />
                </div>

                <div className="flex items-center gap-2">
                  <FilterOutlined className="text-gray-500" />
                  <Select
                    placeholder="Filter by Income"
                    value={incomeFilter}
                    onChange={setIncomeFilter}
                    style={{ width: 150 }}
                    allowClear
                    options={[
                      { value: "high", label: "High (>20K)" },
                      { value: "medium", label: "Medium (10K-20K)" },
                      { value: "low", label: "Low (<10K)" },
                    ]}
                  />
                </div>

                <Select
                  placeholder="Filter by Profit"
                  value={profitFilter}
                  onChange={setProfitFilter}
                  style={{ width: 150 }}
                  allowClear
                  options={[
                    { value: "high", label: "High (>5K)" },
                    { value: "medium", label: "Medium (2K-5K)" },
                    { value: "low", label: "Low (<2K)" },
                  ]}
                />

                <div className="text-sm text-gray-600">
                  Showing {filteredReports.length} of {dailyReports.length} days
                </div>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={filteredReports}
              loading={loading}
              onChange={handleTableChange}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} days`,
                pageSizeOptions: ["10", "15", "25", "50"],
                size: "default",
              }}
              scroll={{ x: 900 }}
              rowKey="date"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
