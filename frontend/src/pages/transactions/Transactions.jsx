import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
} from "lucide-react";

function formatMoney(val) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(val ?? 0);
}

const MOIS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export default function Transactions() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear().toString(),
    mois: "",
    type: "tous",
    modePaiement: "tous",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () =>
      api
        .get("/transactions", {
          params: {
            annee: filters.annee,
            mois: filters.mois || undefined,
            type: filters.type === "tous" ? undefined : filters.type,
            modePaiement:
              filters.modePaiement === "tous"
                ? undefined
                : filters.modePaiement,
          },
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: () => queryClient.invalidateQueries(["transactions"]),
  });

  const transactions = data?.transactions ?? [];
  const soldes = data?.soldes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Comptabilité</h2>
          <p className="text-muted-foreground">
            {transactions.length} transaction(s)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle transaction
        </Button>
      </div>

      {/* Soldes */}
      {soldes && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde Banque
              </CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatMoney(soldes.banque.solde)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{formatMoney(soldes.banque.entrees)} / -
                {formatMoney(soldes.banque.sorties)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde Espèces
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatMoney(soldes.especes.solde)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{formatMoney(soldes.especes.entrees)} / -
                {formatMoney(soldes.especes.sorties)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entrées
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatMoney(soldes.total_entrees)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sorties
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatMoney(soldes.total_sorties)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={filters.annee}
          onValueChange={(v) => setFilters({ ...filters, annee: v })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.mois || "tous"}
          onValueChange={(v) =>
            setFilters({ ...filters, mois: v === "tous" ? "" : v })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous les mois" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les mois</SelectItem>
            {MOIS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(v) => setFilters({ ...filters, type: v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Entrées & Sorties</SelectItem>
            <SelectItem value="entree">Entrées</SelectItem>
            <SelectItem value="sortie">Sorties</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.modePaiement}
          onValueChange={(v) => setFilters({ ...filters, modePaiement: v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Banque & Espèces</SelectItem>
            <SelectItem value="banque">Banque</SelectItem>
            <SelectItem value="espece">Espèces</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p className="text-sm">Aucune transaction trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Membre</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">
                      {new Date(t.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {t.categorie?.couleur && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: t.categorie.couleur }}
                          />
                        )}
                        <span className="text-sm">
                          {t.categorie?.nom ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.membre ? `${t.membre.prenom} ${t.membre.nom}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {t.modePaiement === "banque"
                          ? "🏦 Banque"
                          : "💵 Espèces"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold ${t.type === "entree" ? "text-green-600" : "text-red-600"}`}
                      >
                        {t.type === "entree" ? "+" : "-"}
                        {formatMoney(t.montant)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(t);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            confirm("Supprimer ?") &&
                            deleteMutation.mutate(t.id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TransactionDialog
        open={showForm}
        transaction={editing}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSaved={() => {
          queryClient.invalidateQueries(["transactions"]);
          setShowForm(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function TransactionDialog({ open, transaction, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: transaction?.date ?? new Date().toISOString().split("T")[0],
    type: transaction?.type ?? "entree",
    categorieId: transaction?.categorie?.id?.toString() ?? "",
    montant: transaction?.montant?.toString() ?? "",
    modePaiement: transaction?.modePaiement ?? "banque",
    description: transaction?.description ?? "",
    membreId: transaction?.membre?.id?.toString() ?? "",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const { data: membres = [] } = useQuery({
    queryKey: ["membres"],
    queryFn: () => api.get("/membres").then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      transaction
        ? api.put(`/transactions/${transaction.id}`, data)
        : api.post("/transactions", data),
    onSuccess: onSaved,
  });

  const filteredCategories = categories.filter(
    (c) => c.type === form.type && c.actif !== false,
  );

  const handleSubmit = () => {
    mutation.mutate({
      ...form,
      montant: parseFloat(form.montant),
      categorieId: parseInt(form.categorieId),
      membreId: form.membreId ? parseInt(form.membreId) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Modifier la transaction" : "Nouvelle transaction"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v, categorieId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">Entrée</SelectItem>
                  <SelectItem value="sortie">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Catégorie *</Label>
            <Select
              value={form.categorieId}
              onValueChange={(v) => setForm({ ...form, categorieId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Montant (€) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <Select
                value={form.modePaiement}
                onValueChange={(v) => setForm({ ...form, modePaiement: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banque">Banque</SelectItem>
                  <SelectItem value="espece">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Membre (optionnel)</Label>
            <Select
              value={form.membreId || "aucun"}
              onValueChange={(v) =>
                setForm({ ...form, membreId: v === "aucun" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun membre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucun">Aucun membre</SelectItem>
                {membres.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.prenom} {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Description optionnelle..."
              rows={2}
            />
          </div>

          {mutation.isError && (
            <p className="text-destructive text-sm">
              Une erreur s'est produite.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !form.categorieId || !form.montant}
          >
            {mutation.isPending
              ? "Enregistrement..."
              : transaction
                ? "Modifier"
                : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
