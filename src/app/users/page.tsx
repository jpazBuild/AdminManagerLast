"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "../Layouts/main";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import axios from "axios";
import TextInputWithClearButton from "../components/InputClear";
import { FaSync } from "react-icons/fa";
import { Edit2, Trash2Icon } from "lucide-react";

type User = {
    id: string | number;
    name: string;
};

const UsersPage = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<User["id"] | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<User["id"] | null>(null);
    const [form, setForm] = useState({ name: "", passwordHash: "" });
    const [editForm, setEditForm] = useState<{ name: string; passwordHash?: string }>({ name: "" });
    const [q, setQ] = useState("");

    const filtered = useMemo(
        () =>
            q.trim()
                ? users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))
                : users,
        [users, q]
    );

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`${URL_API_ALB}users`, {});
            if (res.status !== 200) throw new Error(`POST /users failed: ${res.status}`);
            const data = res.data;
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error("Cannot load users.");
        } finally {
            setLoading(false);
        }
    };

    const createUser = async () => {
        if (!form.name.trim() || !form.passwordHash.trim()) {
            alert("Completa nombre y passwordHash.");
            return;
        }
        try {
            setCreating(true);

            const res = await axios.put(`${URL_API_ALB}users`, {
                name: form.name.trim(),
                passwordHash: form.passwordHash,
            });
            if (res.status !== 200) throw new Error(`POST /users/create failed: ${res.status}`);

            setForm({ name: "", passwordHash: "" });
            await fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error("Cannot create user.");
        } finally {
            setCreating(false);
        }
    };

    const startEdit = (u: User) => {
        setEditingId(u.id);
        setEditForm({ name: u.name, passwordHash: "" });
    };

    const saveEdit = async (id: User["id"]) => {
        if (!editForm.name.trim()) {
            toast.error("Name cannot be empty.");
            return;
        }
        try {
            const payload: any = { 
                name: editForm.name.trim(),
                id: id,
                updatedBy:"user"
             };
            const res = await axios.patch(`${URL_API_ALB}users`, { id, ...payload });
            if (res.status !== 200) throw new Error(`PATCH /users/${id} failed: ${res.status}`);
            setEditingId(null);
            await fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error("Cannot save changes.");
        }
    };

    const deleteUser = async (id: User["id"]) => {
        try {
            const res = await axios.delete(`${URL_API_ALB}users`, { data: { id } });
            if (res.status !== 200) throw new Error(`DELETE /users/${id} failed: ${res.status}`);
            setDeleteConfirmId(null);
            await fetchUsers();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar el usuario.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <DashboardHeader onDarkModeChange={setDarkMode}>
            <div className="space-y-6 p-4">
                <h1 className="text-xl font-semibold text-primary/80">Users Page</h1>

                <section className="rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <h2 className="text-lg font-medium mb-3 text-primary/80">Create User</h2>
                    <div className="flex flex-col gap-2">
                        <TextInputWithClearButton
                            id="name"
                            type="text"
                            inputMode="text"
                            placeholder="Nombre"
                            label="Nombre"
                            onChangeHandler={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            value={form.name}
                        />
                        <TextInputWithClearButton
                            id="passwordHash"
                            type="password"
                            inputMode="text"
                            placeholder="1234"
                            label="Password"
                            onChangeHandler={(e) => setForm((f) => ({ ...f, passwordHash: e.target.value }))}
                            value={form.passwordHash}
                        />
                        <button
                            onClick={createUser}
                            disabled={creating}
                            className="self-center cursor-pointer rounded-2xl w-1/2 px-4 py-2 border bg-primary/90 text-white/95 hover:bg-primary/85 shadow-sm disabled:opacity-50"
                        >
                            {creating ? "Creando..." : "Crear"}
                        </button>
                    </div>
                </section>

                <div className="flex items-center gap-2">
                    <TextInputWithClearButton
                        id="search"
                        type="text"
                        inputMode="text"
                        placeholder="Buscar por nombre..."
                        label="Buscar por nombre..."
                        className="max-w-[400px]"
                        onChangeHandler={(e) => setQ(e.target.value)}
                        value={q}
                        isSearch={true}
                    />
                    <button
                        className="rounded-2xl px-4 py-2 border border-primary/70 text-primary/80 shadow-sm"
                        onClick={fetchUsers}
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <section className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                        <span className="text-sm text-gray-600">
                            {loading ? "Cargando..." : `${filtered.length} user(s)`}
                        </span>
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                        {filtered.map((u) => (
                            <div key={u.id} className="shadow-md p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                {editingId === u.id ? (
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <TextInputWithClearButton
                                                id="edit-name"
                                                type="text"
                                                inputMode="text"
                                                placeholder="Nombre"
                                                label="Nombre"
                                                onChangeHandler={(e) =>
                                                    setEditForm((f) => ({ ...f, name: e.target.value }))
                                                }
                                                value={editForm.name}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <button
                                                className="rounded-2xl px-4 py-2 border shadow-sm bg-primary/80 text-white/90 hover:bg-primary/70"
                                                onClick={() => saveEdit(u.id)}
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                className="rounded-2xl px-4 py-2 border border-gray-200 hover:border-gray-300 shadow-sm"
                                                onClick={() => setEditingId(null)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <div className="text-base font-medium">{u.name}</div>
                                            <div className="text-xs text-gray-500">ID: {String(u.id)}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="rounded-2xl px-3 py-1 border border-primary/70  flex gap-2 text-primary text-[14px] items-center hover:border-gray-400 shadow-sm"
                                                onClick={() => startEdit(u)}
                                            >
                                                <Edit2 className="w-3 h-3"/> Edit
                                            </button>
                                            {deleteConfirmId === u.id ? (
                                                <div className="flex gap-2 shadow-md p-1 rounded-md bg-gray-50">
                                                    <button
                                                        className="rounded-2xl px-3 py-1 border border-primary/70  flex gap-2 text-primary text-[14px] items-center hover:border-gray-400 shadow-sm"
                                                        onClick={() => deleteUser(u.id)}
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        className="rounded-2xl px-3 py-1 border border-primary/70  flex gap-2 text-primary text-[14px] items-center hover:border-gray-400 shadow-sm"
                                                        onClick={() => setDeleteConfirmId(null)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="rounded-2xl px-3 py-1 border border-primary/50 flex gap-2 text-primary text-[14px] items-center hover:border-gray-400 shadow-sm"
                                                    onClick={() => setDeleteConfirmId(u.id)}
                                                >
                                                    <Trash2Icon className="w-3 h-3"/> Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {!loading && filtered.length === 0 && (
                            <div className="p-6 text-center text-sm text-gray-500">No results</div>
                        )}
                    </div>
                </section>
            </div>
        </DashboardHeader>
    );
};

export default UsersPage;
