import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Calendar, MapPin } from "lucide-react";

const TYPE_COLORS = {
  culte: "bg-red-100 text-red-700",
  reunion: "bg-blue-100 text-blue-700",
  conference: "bg-purple-100 text-purple-700",
  autre: "bg-gray-100 text-gray-600",
};

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

export default function Evenements() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear().toString(),
    mois: "tous",
    type: "tous",
  });

  const { data: evenements = [], isLoading } = useQuery({
    queryKey: ["evenements", filters],
    queryFn: () =>
      api
        .get("/evenements", {
          params: {
            annee: filters.annee,
            mois: filters.mois === "tous" ? undefined : filters.mois,
            type: filters.type === "tous" ? undefined : filters.type,
          },
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/evenements/${id}`),
    onSuccess: () => queryClient.invalidateQueries(["evenements"]),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Événements</h2>
          <p className="text-muted-foreground">
            {evenements.length} événement(s)
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
          Nouvel événement
        </Button>
      </div>

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
          value={filters.mois}
          onValueChange={(v) => setFilters({ ...filters, mois: v })}
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
            <SelectItem value="tous">Tous les types</SelectItem>
            <SelectItem value="culte">Culte</SelectItem>
            <SelectItem value="reunion">Réunion</SelectItem>
            <SelectItem value="conference">Conférence</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
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
          ) : evenements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">Aucun événement trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Événement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evenements.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <p className="font-medium">{e.titre}</p>
                      {e.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-48">
                          {e.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm">
                            {new Date(e.dateDebut).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {e.dateDebut.split(" ")[1]}
                            {e.dateFin && ` → ${e.dateFin.split(" ")[1]}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {e.lieu ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {e.lieu}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${TYPE_COLORS[e.type] ?? TYPE_COLORS.autre} hover:${TYPE_COLORS[e.type]}`}
                      >
                        {e.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.creePar ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(e);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            confirm("Supprimer cet événement ?") &&
                            deleteMutation.mutate(e.id)
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

      <EvenementDialog
        open={showForm}
        evenement={editing}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSaved={() => {
          queryClient.invalidateQueries(["evenements"]);
          setShowForm(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function EvenementDialog({ open, evenement, onClose, onSaved }) {
  const [form, setForm] = useState({
    titre: evenement?.titre ?? "",
    description: evenement?.description ?? "",
    dateDebut: evenement?.dateDebut ?? "",
    dateFin: evenement?.dateFin ?? "",
    lieu: evenement?.lieu ?? "",
    type: evenement?.type ?? "culte",
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      evenement
        ? api.put(`/evenements/${evenement.id}`, data)
        : api.post("/evenements", data),
    onSuccess: onSaved,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {evenement ? "Modifier l'événement" : "Nouvel événement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <Input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex: Culte du dimanche"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="culte">Culte</SelectItem>
                <SelectItem value="reunion">Réunion</SelectItem>
                <SelectItem value="conference">Conférence</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date & heure début *</Label>
              <Input
                type="datetime-local"
                value={form.dateDebut}
                onChange={(e) =>
                  setForm({ ...form, dateDebut: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date & heure fin</Label>
              <Input
                type="datetime-local"
                value={form.dateFin}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Lieu</Label>
            <Input
              value={form.lieu}
              onChange={(e) => setForm({ ...form, lieu: e.target.value })}
              placeholder="Ex: NJC Grigny"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Description optionnelle..."
              rows={3}
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
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.titre || !form.dateDebut}
          >
            {mutation.isPending
              ? "Enregistrement..."
              : evenement
                ? "Modifier"
                : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
