import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function formatMoney(val) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val ?? 0);
}

const MOIS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then((r) => r.data),
  });

  const { data: rapportData } = useQuery({
    queryKey: ["rapport", new Date().getFullYear()],
    queryFn: () =>
      api
        .get(`/transactions/rapport?annee=${new Date().getFullYear()}`)
        .then((r) => r.data),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#a81c18] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const {
    membres,
    comptabilite,
    transactions,
    activite_recente,
    prochains_evenements,
    inventaire,
  } = data;

  const chartData = rapportData
    ? MOIS.map((mois) => ({
        mois,
        entrees: rapportData.rapport[mois]?.total_entrees ?? 0,
        sorties: rapportData.rapport[mois]?.total_sorties ?? 0,
      }))
    : [];

  const stats = [
    {
      title: "Membres actifs",
      value: membres.actifs,
      sub: `${membres.total} au total`,
      icon: Users,
      trend: true,
      color: "text-[#a81c18]",
      bg: "bg-[#a81c18]/10",
    },
    {
      title: "Solde global",
      value: formatMoney(comptabilite.solde_global),
      sub: `Balance mois : ${formatMoney(comptabilite.balance_mois)}`,
      icon: TrendingUp,
      trend: comptabilite.balance_mois >= 0,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Entrées du mois",
      value: formatMoney(comptabilite.entrees_mois),
      sub: `Sorties : ${formatMoney(comptabilite.sorties_mois)}`,
      icon: TrendingDown,
      trend: true,
      color: "text-[#73b2e2]",
      bg: "bg-[#73b2e2]/10",
    },
    {
      title: "Transactions",
      value: transactions.total_annee,
      sub: `${transactions.total_mois} ce mois`,
      icon: Activity,
      trend: true,
      color: "text-[#e8c162]",
      bg: "bg-[#e8c162]/20",
    },
  ];

  return (
    <div className="space-y-6" style={{ maxWidth: "1400px", width: "100%" }}>
      {/* Alerte inventaire */}
      {inventaire?.alertes > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800 font-medium">
            {inventaire.alertes} matériel(s) en mauvais état —{" "}
            <span className="font-normal">
              {inventaire.liste_alertes.map((m) => m.nom).join(", ")}
            </span>
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ title, value, sub, icon: Icon, trend, color, bg }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {title}
              </CardTitle>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}
              >
                <Icon size={16} className={color} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1b1f28]">{value}</div>
              <div className="flex items-center gap-1 mt-1">
                {trend ? (
                  <ArrowUpRight size={13} className="text-green-500" />
                ) : (
                  <ArrowDownRight size={13} className="text-red-500" />
                )}
                <span className="text-xs text-gray-400">{sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphique + Trésorerie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Entrées & Sorties {new Date().getFullYear()}</CardTitle>
            <CardDescription>Vue mensuelle de la trésorerie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="entrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a81c18" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a81c18" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sorties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#73b2e2" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#73b2e2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                  formatter={(val) => formatMoney(val)}
                />
                <Area
                  type="monotone"
                  dataKey="entrees"
                  stroke="#a81c18"
                  strokeWidth={2}
                  fill="url(#entrees)"
                  name="Entrées"
                />
                <Area
                  type="monotone"
                  dataKey="sorties"
                  stroke="#73b2e2"
                  strokeWidth={2}
                  fill="url(#sorties)"
                  name="Sorties"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#a81c18]" />
                <span className="text-xs text-gray-500">Entrées</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#73b2e2]" />
                <span className="text-xs text-gray-500">Sorties</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trésorerie</CardTitle>
            <CardDescription>Répartition des fonds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Banque</p>
              <p className="text-xl font-bold text-[#1b1f28]">
                {formatMoney(comptabilite.solde_banque)}
              </p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#a81c18] rounded-full transition-all"
                  style={{
                    width: `${comptabilite.solde_global > 0 ? Math.min((comptabilite.solde_banque / comptabilite.solde_global) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Espèces</p>
              <p className="text-xl font-bold text-[#1b1f28]">
                {formatMoney(comptabilite.solde_especes)}
              </p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#73b2e2] rounded-full transition-all"
                  style={{
                    width: `${comptabilite.solde_global > 0 ? Math.min((comptabilite.solde_especes / comptabilite.solde_global) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <span className="text-lg font-bold text-[#a81c18]">
                {formatMoney(comptabilite.solde_global)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Événements + Activité */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Prochains événements</CardTitle>
              <CardDescription>Les 3 prochains</CardDescription>
            </div>
            <Calendar size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            {!prochains_evenements?.length ? (
              <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                Aucun événement à venir
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {prochains_evenements.map((e) => (
                  <div key={e.id} className="py-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#a81c18]/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-[#a81c18] font-bold uppercase">
                        {new Date(e.dateDebut).toLocaleDateString("fr-FR", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-sm font-bold text-[#a81c18]">
                        {new Date(e.dateDebut).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1b1f28] truncate">
                        {e.titre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {e.lieu ?? "Lieu non défini"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {e.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>5 dernières actions</CardDescription>
            </div>
            <Activity size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {activite_recente?.map((log, i) => (
                <div key={i} className="py-3 flex items-center gap-3">
                  <Badge
                    className={`shrink-0 text-xs ${
                      log.action === "CREATE"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : log.action === "UPDATE"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1b1f28] truncate">
                      {log.module}{" "}
                      <span className="text-gray-400">#{log.entiteId}</span>
                    </p>
                    <p className="text-xs text-gray-400">{log.utilisateur}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
