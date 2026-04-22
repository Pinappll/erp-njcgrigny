import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Search, Plus, Pencil, Trash2, Download, Users } from "lucide-react";

export default function Membres() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: membres = [], isLoading } = useQuery({
    queryKey: ["membres", search, statut],
    queryFn: () =>
      api
        .get("/membres", {
          params: {
            search: search || undefined,
            statut: statut === "tous" ? undefined : statut,
          },
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/membres/${id}`),
    onSuccess: () => queryClient.invalidateQueries(["membres"]),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Membres</h2>
          <p className="text-muted-foreground">
            {membres.length} membre(s) enregistré(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/membres/export/csv", "_blank")}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau membre
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="inactif">Inactif</SelectItem>
            <SelectItem value="visiteur">Visiteur</SelectItem>
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
          ) : membres.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">Aucun membre trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membres.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {m.prenom?.[0]}
                            {m.nom?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {m.prenom} {m.nom}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.sexe === "M" ? "Homme" : "Femme"}
                            {m.dateNaissance &&
                              ` · né(e) le ${m.dateNaissance}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{m.telephone ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.email ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.statut === "actif"
                            ? "default"
                            : m.statut === "inactif"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {m.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.groupe ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {m.estMinistre && (
                          <Badge variant="outline">Ministre</Badge>
                        )}
                        {m.estMembreKog && <Badge variant="outline">KOG</Badge>}
                        {!m.estMinistre && !m.estMembreKog && (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(m);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            confirm("Supprimer ce membre ?") &&
                            deleteMutation.mutate(m.id)
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

      {/* Dialog formulaire */}
      <MembreDialog
        open={showForm}
        membre={editing}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSaved={() => {
          queryClient.invalidateQueries(["membres"]);
          setShowForm(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function MembreDialog({ open, membre, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: membre?.nom ?? "",
    prenom: membre?.prenom ?? "",
    sexe: membre?.sexe ?? "M",
    telephone: membre?.telephone ?? "",
    email: membre?.email ?? "",
    statut: membre?.statut ?? "actif",
    groupe: membre?.groupe ?? "",
    estMinistre: membre?.estMinistre ?? false,
    estMembreKog: membre?.estMembreKog ?? false,
    dateNaissance: membre?.dateNaissance ?? "",
    dateBapteme: membre?.dateBapteme ?? "",
    dateArrivee: membre?.dateArrivee ?? "",
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      membre
        ? api.put(`/membres/${membre.id}`, data)
        : api.post("/membres", data),
    onSuccess: onSaved,
  });

  // Reset form quand le membre change
  useState(() => {
    setForm({
      nom: membre?.nom ?? "",
      prenom: membre?.prenom ?? "",
      sexe: membre?.sexe ?? "M",
      telephone: membre?.telephone ?? "",
      email: membre?.email ?? "",
      statut: membre?.statut ?? "actif",
      groupe: membre?.groupe ?? "",
      estMinistre: membre?.estMinistre ?? false,
      estMembreKog: membre?.estMembreKog ?? false,
      dateNaissance: membre?.dateNaissance ?? "",
      dateBapteme: membre?.dateBapteme ?? "",
      dateArrivee: membre?.dateArrivee ?? "",
    });
  }, [membre]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {membre ? "Modifier le membre" : "Nouveau membre"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input
                required
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sexe</Label>
              <Select
                value={form.sexe}
                onValueChange={(v) => setForm({ ...form, sexe: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Homme</SelectItem>
                  <SelectItem value="F">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(v) => setForm({ ...form, statut: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                  <SelectItem value="visiteur">Visiteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Groupe</Label>
            <Input
              value={form.groupe}
              onChange={(e) => setForm({ ...form, groupe: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date naissance</Label>
              <Input
                type="date"
                value={form.dateNaissance}
                onChange={(e) =>
                  setForm({ ...form, dateNaissance: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date baptême</Label>
              <Input
                type="date"
                value={form.dateBapteme}
                onChange={(e) =>
                  setForm({ ...form, dateBapteme: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date arrivée</Label>
              <Input
                type="date"
                value={form.dateArrivee}
                onChange={(e) =>
                  setForm({ ...form, dateArrivee: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.estMinistre}
                onCheckedChange={(v) => setForm({ ...form, estMinistre: v })}
              />
              <Label>Ministre</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.estMembreKog}
                onCheckedChange={(v) => setForm({ ...form, estMembreKog: v })}
              />
              <Label>Membre KOG</Label>
            </div>
          </div>

          {mutation.isError && (
            <p className="text-destructive text-sm">
              Une erreur s'est produite. Réessayez.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Enregistrement..."
              : membre
                ? "Modifier"
                : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
