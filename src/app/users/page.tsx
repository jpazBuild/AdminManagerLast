"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "../Layouts/main";
import { URL_API_ALB } from "@/config";
import { toast } from "sonner";
import axios from "axios";
import TextInputWithClearButton from "../components/InputClear";
import { FaSync } from "react-icons/fa";
import { Edit2, Trash2Icon } from "lucide-react";
import PaginationResults from "../dashboard/components/PaginationResults";
import { usePagination } from "../hooks/usePagination";
import ModalCustom from "../components/ModalCustom";
import { RiInformation2Line } from "react-icons/ri";
import NoData from "../components/NoData";

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

    const surface = darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
    const subSurface = darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200";
    const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
    const softText = darkMode ? "text-gray-300" : "text-gray-600";
    const strongText = darkMode ? "text-gray-100" : "text-primary/90";
    const primaryBtn = darkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white";
    const outlineBtn = darkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-800 hover:bg-gray-100";
    const linkBtn = darkMode ? "border-white/40 text-white/70 hover:border-white/70" : "border-primary/70 text-primary/80 hover:border-primary/80";

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
            toast.warning("Complete name and password")
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
                updatedBy: "user",
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

    const {
        page, setPage,
        pageSize, setPageSize,
        totalItems,
        items: paginatedSelectedTests,
    } = usePagination(filtered, 10);

    return (
        <DashboardHeader onDarkModeChange={setDarkMode}>
            <div className={`space-y-6 p-4 ${darkMode ? "text-gray-100" : "text-primary/80"}`}>
                <h1 className={`text-xl font-semibold ${strongText}`}>Users Page</h1>

                {/* Create User */}
                <section className={`rounded-2xl border p-4 shadow-sm ${surface}`}>
                    <h2 className={`text-lg font-medium mb-3 ${strongText}`}>Create User</h2>
                    <div className="flex flex-col gap-2">
                        <TextInputWithClearButton
                            id="name"
                            type="text"
                            inputMode="text"
                            placeholder="Name"
                            label="Name"
                            onChangeHandler={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            value={form.name}
                            isDarkMode={darkMode}
                        />
                        <TextInputWithClearButton
                            id="passwordHash"
                            type="password"
                            inputMode="text"
                            placeholder="1234"
                            label="Password"
                            onChangeHandler={(e) => setForm((f) => ({ ...f, passwordHash: e.target.value }))}
                            value={form.passwordHash}
                            isDarkMode={darkMode}
                        />
                        <button
                            onClick={createUser}
                            disabled={creating}
                            className={`self-center cursor-pointer font-semibold rounded-2xl w-48 px-4 py-2 shadow-sm disabled:opacity-50 ${primaryBtn}`}
                        >
                            {creating ? "Creating..." : "Create"}
                        </button>
                    </div>
                </section>

                <div className="flex items-center gap-2">
                    <TextInputWithClearButton
                        id="search"
                        type="text"
                        inputMode="text"
                        placeholder="Search by name..."
                        label="Search by name..."
                        className="max-w-[400px]"
                        onChangeHandler={(e) => setQ(e.target.value)}
                        value={q}
                        isSearch={true}
                        isDarkMode={darkMode}
                    />
                    <button
                        className={`rounded-2xl px-4 py-2 border shadow-sm flex items-center justify-center ${linkBtn}`}
                        onClick={fetchUsers}
                        title="Refresh"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <section className={`rounded-2xl border shadow-sm overflow-hidden ${surface}`}>
                    <div className={`flex justify-between items-center px-4 py-3 ${subSurface}`}>
                        <span className={`text-sm ${softText}`}>
                            {loading ? "Cargando..." : `${filtered.length} user(s)`}
                        </span>
                    </div>

                    <div className="flex flex-col gap-4 pt-2 px-2">
                        <PaginationResults
                            totalItems={totalItems}
                            pageSize={pageSize}
                            setPageSize={setPageSize}
                            page={page}
                            setPage={setPage}
                            darkMode={darkMode}
                        />

                        {paginatedSelectedTests.map((u) => (
                            <div
                                key={u.id}
                                className={`p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border ${cardBg}`}
                            >
                                {editingId === u.id ? (
                                    <ModalCustom
                                        open={true}
                                        onClose={() => setEditingId(null)}
                                        width="sm:max-w-lg"
                                        isDarkMode={darkMode}
                                    >
                                        <div className="flex flex-col gap-4 mt-10 overflow-hidden">
                                            <RiInformation2Line className={`w-8 h-8 text-center self-center ${darkMode ? "text-gray-400" : "text-primary/60"} mx-auto"`} />
                                            <h2 className={`text-lg ${darkMode ? "text-white/80" : "text-primary/80 "} text-center font-semibold ${strongText}`}>
                                                Edit User
                                            </h2>
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
                                                    isDarkMode={darkMode}
                                                />
                                            </div>
                                            <div className="flex items-end gap-2 mt-4 w-full">

                                                <button
                                                    className={`rounded-2xl px-4 py-2 border shadow-sm w-full ${outlineBtn}`}
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    className={`rounded-2xl px-4 py-2 shadow-sm w-full ${primaryBtn}`}
                                                    onClick={() => saveEdit(u.id)}
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    </ModalCustom>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <div className={`text-base font-medium ${strongText}`}>{u.name}</div>
                                            <div className={`text-xs ${softText}`}>ID: {String(u.id)}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className={`cursor-pointer rounded-2xl px-3 py-1 border flex gap-2 text-[14px] items-center shadow-sm ${darkMode ? "text-white bg-gray-900" : ""} ${linkBtn}`}
                                                onClick={() => startEdit(u)}
                                            >
                                                <Edit2 className="w-3 h-3" /> Edit
                                            </button>
                                            <button
                                                className={`rounded-2xl px-3 py-1 border flex gap-2 text-[14px] ${darkMode ? "text-white bg-gray-900" : ""} items-center shadow-sm ${linkBtn}`}
                                                onClick={() => setDeleteConfirmId(u.id)}
                                            >
                                                <Trash2Icon className="w-3 h-3" /> Eliminar
                                            </button>
                                            {deleteConfirmId === u.id && (

                                                <ModalCustom
                                                    open={true}
                                                    onClose={() => setDeleteConfirmId(null)}
                                                    width="sm:max-w-lg"
                                                    isDarkMode={darkMode}
                                                >
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex flex-col gap-2 justify-center">
                                                            <Trash2Icon className={`w-8 h-8 text-center self-center ${darkMode ? "text-gray-400" : "text-primary/6"} mx-auto"`} />
                                                            <h2 className={`text-lg ${darkMode ? "text-white/80" : "text-primary/80"} text-center font-semibold ${strongText}`}>
                                                                Are you sure you want to delete this user?
                                                            </h2>
                                                        </div>

                                                        <div className={`text-md px-1 text-center ${darkMode ? "text-white/80" : "text-primary/50"}  ${softText}`}>
                                                            Once deleted, this action cannot be undone.
                                                        </div>

                                                        <div className="w-full mt-4 flex justify-center gap-2">
                                                            <button
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className={`w-full border border-gray-300 ${darkMode ? "text-white/90" : ""} px-4 py-2 font-semibold rounded hover:bg-gray-100`}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => deleteUser(u.id)}
                                                                className={`w-full ${darkMode ? "bg-red-600/80" : "bg-red-600/90"} font-semibold  text-white px-4 py-2 rounded hover:bg-red-700/95 disabled:opacity-60`}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </ModalCustom>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {!loading && filtered.length === 0 && (
                            <NoData darkMode={darkMode} text="No users found"/>
                        )}
                    </div>
                </section>
            </div>
        </DashboardHeader>
    );
};

export default UsersPage;
