
import { useEffect, useMemo, useState } from "react";
import {
    LayoutDashboard,
    CheckSquare,
    Clock3,
    Plus,
    Search,
    LogOut,
    Menu,
    X,
    CheckCircle2,
    Circle,
    ListTodo,
    CalendarDays,
    LoaderCircle,
    LockKeyhole,
    Mail,
    ArrowRight,
    Pencil,
    Trash2,
    Save,
    User,
    Eye,
    EyeOff,
    Sparkles,
    RefreshCw,
    AlertCircle,
    ChevronRight,
    ShieldCheck,
} from "lucide-react";

import api from "./services/api";

const TOKEN_KEY = "taskflow_access_token";

function App() {
    // AUTHENTICATION
    const [token, setToken] = useState(
        () => localStorage.getItem(TOKEN_KEY)
    );

    const [authMode, setAuthMode] = useState("login");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    // TASKS
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // DASHBOARD
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [mobileMenu, setMobileMenu] = useState(false);

    // CREATE TASK
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [creating, setCreating] = useState(false);

    // EDIT TASK
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [updating, setUpdating] = useState(false);


    // AUTHORIZATION HEADER
    function authConfig(accessToken = token) {
        return {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
    }


    // CLEAR AUTHENTICATION
    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setTasks([]);
        setEmail("");
        setPassword("");
        setUsername("");
        setError("");
        setSuccess("");
        setFilter("all");
        setSearch("");
    }


    // LOAD TASKS
    async function loadTasks(accessToken = token) {
        const response = await api.get(
            "/api/tasks/",
            authConfig(accessToken)
        );

        setTasks(response.data);
        return response.data;
    }


    // RESTORE SESSION AFTER PAGE REFRESH
    useEffect(() => {
        let active = true;

        async function restoreSession() {
            const savedToken = localStorage.getItem(TOKEN_KEY);

            if (!savedToken) {
                if (active) {
                    setAuthChecking(false);
                }
                return;
            }

            try {
                const response = await api.get(
                    "/api/tasks/",
                    authConfig(savedToken)
                );

                if (active) {
                    setTasks(response.data);
                    setToken(savedToken);
                }
            } catch (err) {
                console.error("Session restoration failed:", err);

                if (active) {
                    localStorage.removeItem(TOKEN_KEY);
                    setToken(null);
                    setTasks([]);
                }
            } finally {
                if (active) {
                    setAuthChecking(false);
                }
            }
        }

        restoreSession();

        return () => {
            active = false;
        };
    }, []);


    // LOGIN
    async function handleLogin(event) {
        event.preventDefault();

        setAuthLoading(true);
        setError("");
        setSuccess("");

        try {
            const formData = new URLSearchParams();

            formData.append("username", email);
            formData.append("password", password);

            const response = await api.post(
                "/api/auth/token",
                formData,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const accessToken = response.data.access_token;

            // Save token so page refresh does not log the user out.
            localStorage.setItem(TOKEN_KEY, accessToken);

            setToken(accessToken);

            await loadTasks(accessToken);

            setPassword("");
            setError("");

        } catch (err) {
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);

            setError(
                err.response?.data?.detail ||
                "Login failed. Please check your email and password."
            );
        } finally {
            setAuthLoading(false);
        }
    }


    // REGISTER
    async function handleRegister(event) {
        event.preventDefault();

        setAuthLoading(true);
        setError("");
        setSuccess("");

        try {
            await api.post(
                "/api/auth/register",
                {
                    username: username.trim(),
                    email: email.trim(),
                    password: password,
                }
            );

            // Automatically sign in after successful registration.
            const formData = new URLSearchParams();

            formData.append("username", email.trim());
            formData.append("password", password);

            const loginResponse = await api.post(
                "/api/auth/token",
                formData,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const accessToken = loginResponse.data.access_token;

            localStorage.setItem(TOKEN_KEY, accessToken);
            setToken(accessToken);

            await loadTasks(accessToken);

            setPassword("");
            setUsername("");
            setError("");

        } catch (err) {
            // If registration succeeded but automatic login failed,
            // the account may still exist. The user can sign in manually.
            const message =
                err.response?.data?.detail ||
                "Registration failed. Please try again.";

            setError(
                typeof message === "string"
                    ? message
                    : "Registration failed. Please check your information."
            );
        } finally {
            setAuthLoading(false);
        }
    }


    // CREATE TASK
    async function handleCreateTask(event) {
        event.preventDefault();

        if (!newTitle.trim()) return;

        setCreating(true);
        setError("");
        setSuccess("");

        try {
            await api.post(
                "/api/tasks/",
                {
                    title: newTitle.trim(),
                    description: newDescription.trim() || null,
                    completed: false,
                },
                authConfig()
            );

            await loadTasks();

            setNewTitle("");
            setNewDescription("");
            setShowCreateForm(false);
            setSuccess("Task created successfully.");

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Could not create the task."
            );
        } finally {
            setCreating(false);
        }
    }


    // COMPLETE / UNDO TASK
    async function toggleTask(task) {
        setError("");

        try {
            const response = await api.patch(
                `/api/tasks/${task.id}`,
                {
                    completed: !task.completed,
                },
                authConfig()
            );

            setTasks((current) =>
                current.map((item) =>
                    item.id === task.id ? response.data : item
                )
            );

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Could not update task."
            );
        }
    }


    // DELETE TASK
    async function deleteTask(taskId) {
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        setError("");

        try {
            await api.delete(
                `/api/tasks/${taskId}`,
                authConfig()
            );

            setTasks((current) =>
                current.filter((task) => task.id !== taskId)
            );

            if (editingTaskId === taskId) {
                cancelEditing();
            }

            setSuccess("Task deleted successfully.");

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Could not delete task."
            );
        }
    }


    // START EDITING
    function startEditing(task) {
        setEditingTaskId(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description || "");
        setError("");
    }


    // CANCEL EDITING
    function cancelEditing() {
        setEditingTaskId(null);
        setEditTitle("");
        setEditDescription("");
    }


    // SAVE EDITED TASK
    async function handleUpdateTask(event) {
        event.preventDefault();

        if (editTitle.trim().length < 3) {
            setError("Task title must contain at least 3 characters.");
            return;
        }

        setUpdating(true);
        setError("");

        try {
            const response = await api.patch(
                `/api/tasks/${editingTaskId}`,
                {
                    title: editTitle.trim(),
                    description: editDescription.trim() || null,
                },
                authConfig()
            );

            setTasks((current) =>
                current.map((task) =>
                    task.id === editingTaskId ? response.data : task
                )
            );

            cancelEditing();
            setSuccess("Task updated successfully.");

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Could not update task."
            );
        } finally {
            setUpdating(false);
        }
    }


    // LOGOUT
    function handleLogout() {
        clearSession();
        setMobileMenu(false);
        setAuthMode("login");
    }


    // STATISTICS
    const completedTasks = tasks.filter(
        (task) => task.completed
    ).length;

    const pendingTasks = tasks.length - completedTasks;

    const completionRate = tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;


    // SEARCH AND FILTER
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                task.title.toLowerCase().includes(searchText) ||
                (task.description || "").toLowerCase().includes(searchText);

            const matchesFilter =
                filter === "all" ||
                (filter === "pending" && !task.completed) ||
                (filter === "completed" && task.completed);

            return matchesSearch && matchesFilter;
        });
    }, [tasks, search, filter]);


    // LOADING SCREEN WHILE RESTORING SESSION
    if (authChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30">
                        <CheckSquare size={32} />
                    </div>

                    <LoaderCircle className="mx-auto animate-spin text-indigo-400" size={26} />

                    <p className="mt-4 text-sm font-medium text-slate-300">
                        Restoring your workspace...
                    </p>
                </div>
            </div>
        );
    }


    // LOGIN AND REGISTER SCREENS
    if (!token) {
        const isRegister = authMode === "register";

        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">

                <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

                <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">

                    {/* BRAND PANEL */}
                    <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 p-12 text-white lg:flex">

                        <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
                        <div className="absolute -right-12 top-32 h-48 w-48 rounded-full border border-white/10" />

                        <div className="relative">
                            <div className="mb-14 flex items-center gap-3">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <CheckSquare size={28} />
                                </div>

                                <span className="text-2xl font-bold tracking-tight">
                                    TaskFlow
                                </span>
                            </div>

                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                                <Sparkles size={14} />
                                YOUR PRODUCTIVITY WORKSPACE
                            </div>

                            <h1 className="text-5xl font-bold leading-tight tracking-tight">
                                Make every
                                <br />
                                day count.
                            </h1>

                            <p className="mt-6 max-w-sm text-base leading-7 text-indigo-100">
                                Organize your work, prioritize your goals,
                                and turn your ideas into completed tasks.
                            </p>

                            <div className="mt-10 space-y-4 text-sm text-indigo-100">
                                {[
                                    "Keep all your tasks in one place",
                                    "Track your daily productivity",
                                    "Stay focused on what matters",
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-3">
                                        <CheckCircle2 size={18} />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative flex items-center gap-2 text-sm text-indigo-200">
                            <ShieldCheck size={17} />
                            Secure authentication powered by FastAPI
                        </div>
                    </section>


                    {/* AUTH FORM */}
                    <section className="px-7 py-10 sm:px-12 lg:py-14">

                        <div className="mb-10 lg:hidden">
                            <div className="flex items-center gap-3 text-indigo-600">
                                <CheckSquare size={29} />
                                <span className="text-2xl font-bold">
                                    TaskFlow
                                </span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                                {isRegister ? "GET STARTED" : "WELCOME BACK"}
                            </p>

                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                                {isRegister
                                    ? "Create your account"
                                    : "Sign in to TaskFlow"
                                }
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                {isRegister
                                    ? "Create your free account and start organizing your work."
                                    : "Enter your account details to access your workspace."
                                }
                            </p>
                        </div>


                        <form
                            onSubmit={isRegister ? handleRegister : handleLogin}
                            className="space-y-5"
                        >

                            {isRegister && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Username
                                    </label>

                                    <div className="flex items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                                        <User size={18} className="text-slate-400" />

                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Your username"
                                            minLength={3}
                                            maxLength={50}
                                            required
                                            autoComplete="username"
                                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            )}


                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Email address
                                </label>

                                <div className="flex items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                                    <Mail size={18} className="text-slate-400" />

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                        className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                    />
                                </div>
                            </div>


                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Password
                                </label>

                                <div className="flex items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                                    <LockKeyhole size={18} className="text-slate-400" />

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        minLength={isRegister ? 8 : undefined}
                                        required
                                        autoComplete={isRegister ? "new-password" : "current-password"}
                                        className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-400 hover:text-slate-700"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword
                                            ? <EyeOff size={18} />
                                            : <Eye size={18} />
                                        }
                                    </button>
                                </div>

                                {isRegister && (
                                    <p className="mt-2 text-xs text-slate-400">
                                        Password must contain at least 8 characters.
                                    </p>
                                )}
                            </div>


                            {error && (
                                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}


                            <button
                                type="submit"
                                disabled={authLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {authLoading ? (
                                    <>
                                        <LoaderCircle size={19} className="animate-spin" />
                                        {isRegister ? "Creating account..." : "Signing in..."}
                                    </>
                                ) : (
                                    <>
                                        {isRegister ? "Create account" : "Sign in"}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>


                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-500">
                                {isRegister
                                    ? "Already have an account?"
                                    : "Don't have an account?"
                                }

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMode(isRegister ? "login" : "register");
                                        setError("");
                                        setPassword("");
                                    }}
                                    className="ml-2 font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                    {isRegister ? "Sign in" : "Register"}
                                </button>
                            </p>
                        </div>

                        <p className="mt-8 text-center text-xs text-slate-400">
                            By continuing, you agree to use TaskFlow responsibly.
                        </p>
                    </section>
                </div>
            </main>
        );
    }


    // DASHBOARD
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">

            {/* MOBILE OVERLAY */}
            {mobileMenu && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileMenu(false)}
                />
            )}


            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
                    mobileMenu ? "translate-x-0" : "-translate-x-full"
                }`}
            >

                <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-lg shadow-indigo-600/20">
                            <CheckSquare size={23} />
                        </div>

                        <span className="text-xl font-extrabold tracking-tight">
                            TaskFlow
                        </span>
                    </div>

                    <button
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                        onClick={() => setMobileMenu(false)}
                    >
                        <X size={22} />
                    </button>
                </div>


                <nav className="flex-1 space-y-2 px-4 py-8">
                    <p className="mb-5 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                        Workspace
                    </p>

                    {[
                        {
                            value: "all",
                            label: "Dashboard",
                            icon: LayoutDashboard,
                        },
                        {
                            value: "pending",
                            label: "Pending tasks",
                            icon: Clock3,
                        },
                        {
                            value: "completed",
                            label: "Completed tasks",
                            icon: CheckCircle2,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.value}
                                onClick={() => {
                                    setFilter(item.value);
                                    setMobileMenu(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm transition ${
                                    filter === item.value
                                        ? "bg-indigo-50 font-bold text-indigo-700"
                                        : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <Icon size={19} />
                                {item.label}

                                {filter === item.value && (
                                    <ChevronRight size={17} className="ml-auto" />
                                )}
                            </button>
                        );
                    })}
                </nav>


                {/* SIDEBAR PROFILE */}
                <div className="border-t border-slate-100 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                            {email.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">
                                {email || "My account"}
                            </p>

                            <p className="text-xs text-slate-400">
                                Personal workspace
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut size={18} />
                        Sign out
                    </button>
                </div>
            </aside>


            {/* MAIN */}
            <main className="min-h-screen lg:ml-72">

                {/* TOPBAR */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-xl sm:px-8">

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenu(true)}
                            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
                        >
                            <Menu size={22} />
                        </button>

                        <div>
                            <h1 className="text-lg font-extrabold text-slate-900">
                                {filter === "pending"
                                    ? "Pending tasks"
                                    : filter === "completed"
                                        ? "Completed tasks"
                                        : "Dashboard"
                                }
                            </h1>

                            <p className="hidden text-xs text-slate-400 sm:block">
                                Your personal productivity workspace
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-500 sm:flex">
                            <CalendarDays size={16} />
                            My workspace
                        </div>

                        <button
                            onClick={() => loadTasks()}
                            title="Refresh tasks"
                            className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </header>


                {/* DASHBOARD CONTENT */}
                <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">

                    {/* WELCOME */}
                    <section className="flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-indigo-600/10 sm:flex-row sm:items-center sm:p-9">

                        <div>
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-100">
                                <Sparkles size={16} />
                                YOUR WORKSPACE
                            </div>

                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Welcome back!
                            </h2>

                            <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100">
                                Stay organized, focus on your priorities,
                                and make progress one task at a time.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                        >
                            <Plus size={19} />
                            New task
                        </button>
                    </section>


                    {/* NOTIFICATIONS */}
                    {error && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            {error}
                            <button
                                onClick={() => setError("")}
                                className="ml-auto font-bold"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                            <CheckCircle2 size={18} />
                            {success}
                            <button
                                onClick={() => setSuccess("")}
                                className="ml-auto font-bold"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    )}


                    {/* CREATE FORM */}
                    {showCreateForm && (
                        <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-7">

                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">
                                        Create a new task
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Add something you want to accomplish.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form
                                onSubmit={handleCreateTask}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Task title
                                    </label>

                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="What needs to be done?"
                                        minLength={3}
                                        maxLength={100}
                                        required
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Description
                                    </label>

                                    <textarea
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Add more details (optional)"
                                        rows={3}
                                        maxLength={500}
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                                    >
                                        {creating
                                            ? <LoaderCircle size={17} className="animate-spin" />
                                            : <Plus size={17} />
                                        }
                                        {creating ? "Creating..." : "Create task"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}


                    {/* STATISTICS */}
                    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                        <StatCard
                            title="Total tasks"
                            value={tasks.length}
                            icon={<ListTodo size={21} />}
                            color="indigo"
                            subtitle="All your tasks"
                        />

                        <StatCard
                            title="Pending"
                            value={pendingTasks}
                            icon={<Clock3 size={21} />}
                            color="amber"
                            subtitle="Still to complete"
                        />

                        <StatCard
                            title="Completed"
                            value={completedTasks}
                            icon={<CheckCircle2 size={21} />}
                            color="emerald"
                            subtitle="Successfully finished"
                        />

                        <StatCard
                            title="Completion rate"
                            value={`${completionRate}%`}
                            icon={<CheckSquare size={21} />}
                            color="violet"
                            subtitle="Your overall progress"
                        />

                    </section>


                    {/* PROGRESS */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900">
                                    Your progress
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    Keep moving towards your goals.
                                </p>
                            </div>

                            <span className="text-xl font-extrabold text-indigo-600">
                                {completionRate}%
                            </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                            {completedTasks} out of {tasks.length} tasks completed
                        </p>
                    </section>


                    {/* TASK SECTION */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* HEADER */}
                        <div className="flex flex-col justify-between gap-5 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900">
                                    Your tasks
                                </h3>

                                <p className="mt-1 text-sm text-slate-400">
                                    Manage, organize, and track your work.
                                </p>
                            </div>

                            <div className="relative w-full sm:max-w-xs">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>
                        </div>


                        {/* FILTERS */}
                        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:px-7">
                            {[
                                ["all", "All tasks", tasks.length],
                                ["pending", "Pending", pendingTasks],
                                ["completed", "Completed", completedTasks],
                            ].map(([value, label, count]) => (
                                <button
                                    key={value}
                                    onClick={() => setFilter(value)}
                                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                                        filter === value
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    {label}

                                    <span className={`rounded-md px-1.5 py-0.5 text-xs ${
                                        filter === value
                                            ? "bg-indigo-100"
                                            : "bg-slate-100"
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            ))}
                        </div>


                        {/* TASK ITEMS */}
                        <div className="divide-y divide-slate-100">

                            {loading ? (
                                <div className="py-16 text-center">
                                    <LoaderCircle className="mx-auto animate-spin text-indigo-500" size={30} />
                                    <p className="mt-3 text-sm text-slate-400">
                                        Loading tasks...
                                    </p>
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="px-6 py-16 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                                        <ListTodo size={29} />
                                    </div>

                                    <h4 className="font-bold text-slate-800">
                                        {search
                                            ? "No matching tasks"
                                            : "Your workspace is empty"
                                        }
                                    </h4>

                                    <p className="mt-2 text-sm text-slate-400">
                                        {search
                                            ? "Try a different search term."
                                            : "Create your first task to get started."
                                        }
                                    </p>

                                    {!search && (
                                        <button
                                            onClick={() => setShowCreateForm(true)}
                                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                                        >
                                            <Plus size={17} />
                                            Create your first task
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="px-5 py-5 transition hover:bg-slate-50/70 sm:px-7"
                                    >

                                        {editingTaskId === task.id ? (

                                            // EDIT FORM
                                            <form
                                                onSubmit={handleUpdateTask}
                                                className="space-y-3"
                                            >
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    minLength={3}
                                                    maxLength={100}
                                                    required
                                                    placeholder="Task title"
                                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                                />

                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    maxLength={500}
                                                    rows={2}
                                                    placeholder="Task description"
                                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                                />

                                                <div className="flex gap-2">
                                                    <button
                                                        type="submit"
                                                        disabled={updating}
                                                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                                                    >
                                                        <Save size={16} />
                                                        {updating ? "Saving..." : "Save changes"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={cancelEditing}
                                                        disabled={updating}
                                                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>

                                        ) : (

                                            // TASK DISPLAY
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                                                <button
                                                    type="button"
                                                    onClick={() => toggleTask(task)}
                                                    title={
                                                        task.completed
                                                            ? "Mark as pending"
                                                            : "Mark as completed"
                                                    }
                                                    className={`shrink-0 transition hover:scale-110 ${
                                                        task.completed
                                                            ? "text-emerald-500"
                                                            : "text-slate-300 hover:text-emerald-500"
                                                    }`}
                                                >
                                                    {task.completed
                                                        ? <CheckCircle2 size={23} />
                                                        : <Circle size={23} />
                                                    }
                                                </button>


                                                <div className="min-w-0 flex-1">
                                                    <h4 className={`font-bold ${
                                                        task.completed
                                                            ? "text-slate-400 line-through"
                                                            : "text-slate-800"
                                                    }`}>
                                                        {task.title}
                                                    </h4>

                                                    {task.description && (
                                                        <p className="mt-1 break-words text-sm leading-6 text-slate-400">
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    <p className="mt-2 text-xs text-slate-400">
                                                        Task #{task.id}
                                                    </p>
                                                </div>


                                                <div className="flex flex-wrap items-center gap-2">

                                                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                                        task.completed
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-amber-50 text-amber-700"
                                                    }`}>
                                                        {task.completed
                                                            ? "Completed"
                                                            : "Pending"
                                                        }
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(task)}
                                                        title="Edit task"
                                                        className="rounded-lg border border-indigo-100 bg-indigo-50 p-2.5 text-indigo-600 transition hover:bg-indigo-100"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => deleteTask(task.id)}
                                                        title="Delete task"
                                                        className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>


                        {/* FOOTER */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:px-7">
                            <span>
                                Showing {filteredTasks.length} of {tasks.length} tasks
                            </span>

                            <span>
                                {completedTasks} completed · {pendingTasks} pending
                            </span>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}


// STATISTICS CARD
function StatCard({ title, value, icon, color, subtitle }) {
    const styles = {
        indigo: "bg-indigo-50 text-indigo-600",
        amber: "bg-amber-50 text-amber-600",
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                    {title}
                </p>

                <div className={`rounded-xl p-3 ${styles[color]}`}>
                    {icon}
                </div>
            </div>

            <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
                {value}
            </p>

            <p className="mt-1 text-xs text-slate-400">
                {subtitle}
            </p>
        </div>
    );
}

export default App;
