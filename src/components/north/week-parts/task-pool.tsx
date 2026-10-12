"use client";

import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  GripVertical,
  Layers,
  LayoutGrid,
  List,
  Minus,
  MoveRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getAreaStyling } from "./area-styling";
import { cn } from "@/lib/utils";
import type { WeekPlan } from "./use-week-plan";

export function TaskPool({ ctx }: { ctx: WeekPlan }) {
  const {
    activeAreaFilter,
    setActiveAreaFilter,
    scopeFilter,
    setScopeFilter,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    activePlanDays,
    setReplanModalOpen,
    setTempPlanDays,
    setTempExcludedAreas,
    currentWeekKey,
    setAssignDayTarget,
    searchInputRef,
    activeAreas,
    weekDays,
    allTasksInScope,
    filteredTasks,
    currentWeekTasks,
    completedTasks,
    plannedMinutes,
    handleToggleAreaForWeek,
    handleToggleTask,
    handleShrinkTask,
    handlePoolTask,
    handlePostponeTask,
    handleDropTask,
    openCreateTaskModal,
    openEditTaskModal,
    state,
  } = ctx;
  return (
    <>
    {/* BEGIN: TaskPoolSection (REDESIGNED SAAS / LINEAR STYLE) */}
    <section className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xs relative">
      {/* Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                Görev Havuzu &amp; Düzenleme
                <span className="px-2 py-0.5 text-xs font-semibold text-blue-400 bg-blue-500/10 rounded-md border border-blue-500/20 font-mono">
                  {filteredTasks.length} Görev
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">Bu haftanın planlanmış ve esnek görevleri • Sürükle, önceliklendir ve çalıştır</p>
            </div>
          </div>
        </div>

        {/* Controls & Quick Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input (⌘K) */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-input rounded-xl py-2 pl-9 pr-8 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              placeholder="Görev ara..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Time Scope Filter */}
          <div className="relative">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as "thisWeek" | "nextWeek" | "all")}
              className="bg-background border border-input text-xs font-semibold text-foreground rounded-xl py-2 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-muted transition"
            >
              <option value="thisWeek">Bu Hafta ({currentWeekTasks.length})</option>
              <option value="nextWeek">Gelecek Hafta</option>
              <option value="all">Tüm Dönem ({state.tasks.filter((t) => t.status !== "cancelled").length})</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "active" | "done" | "all")}
              className="bg-background border border-input text-xs font-semibold text-foreground rounded-xl py-2 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-muted transition"
            >
              <option value="active">Aktif ({currentWeekTasks.filter((t) => t.status !== "done").length})</option>
              <option value="done">Tamamlanan ({completedTasks.length})</option>
              <option value="all">Tümü</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-background border border-input rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition",
                viewMode === "list" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
              )}
              title="Detaylı Liste Görünümü"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
                viewMode === "kanban" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
              )}
              title="Kart Izgara Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartlar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveAreaFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition",
              activeAreaFilter === "all"
                ? "bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/40"
                : "bg-card hover:bg-muted text-muted-foreground border border-border"
            )}
          >
            <span>Tümü</span>
            <span className="px-1.5 py-0.2 bg-blue-500/30 rounded-md text-[10px] font-mono">
              {allTasksInScope.length}
            </span>
          </button>

          {activeAreas.map((area) => {
            const styling = getAreaStyling(area.id, area.name);
            const count = allTasksInScope.filter((t) => t.areaId === area.id).length;
            const isSelected = activeAreaFilter === area.id;
            const isExcluded = (state.weeklyAreaExclusions?.[currentWeekKey] ?? []).includes(area.id);

            return (
              <div
                key={area.id}
                className={cn(
                  "inline-flex items-center rounded-xl border transition shadow-xs overflow-hidden",
                  isSelected
                    ? "border-blue-500/60 bg-muted text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40",
                  isExcluded && "opacity-60 bg-muted/20"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveAreaFilter(isSelected ? "all" : area.id)}
                  className="px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: styling.color }} />
                  <span className={cn(isExcluded && "line-through text-muted-foreground")}>{area.name}</span>
                  <span className="px-1.5 py-0.2 bg-muted rounded-md text-[10px] font-mono text-muted-foreground">
                    {count}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAreaForWeek(area.id);
                  }}
                  title={isExcluded ? "Bu haftaya dahil et (Planda Aktifleştir)" : "Bu hafta mola ver (Havuza al)"}
                  className={cn(
                    "px-1.5 py-1.5 border-l border-border text-[10px] font-bold transition flex items-center gap-1 hover:bg-muted/80",
                    isExcluded
                      ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isExcluded ? "⏸ Mola" : "✓ Aktif"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempPlanDays(activePlanDays);
              setTempExcludedAreas(state.weeklyAreaExclusions?.[currentWeekKey] ?? []);
              setReplanModalOpen(true);
            }}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition border border-border"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Haftalık Alanlar & Günler</span>
          </button>
          <button
            onClick={() => openCreateTaskModal()}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition border border-dashed border-border"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Hızlı Görev Ekle</span>
          </button>
        </div>
      </div>

      {/* Modern Task Cards List Container */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center rounded-xl bg-muted/30 border border-border">
          <p className="text-sm text-muted-foreground">Bu filtreye uygun görev bulunamadı.</p>
          <button
            onClick={() => {
              setActiveAreaFilter("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-700 dark:text-blue-300"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2.5 mt-2">
          {filteredTasks.map((task) => {
            const area = state.areas.find((a) => a.id === task.areaId);
            const styling = getAreaStyling(task.areaId, area?.name);
            const isDone = task.status === "done";

            const assignedDayObj = task.date
              ? weekDays.find((d) => d.date === task.date)
              : null;

            return (
              <article
                key={task.id}
                className={cn(
                  "group relative bg-card hover:bg-muted/50 border rounded-xl p-3.5 sm:p-4 transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4",
                  isDone
                    ? "border-border opacity-75"
                    : "border-border hover:border-blue-500/40 hover:shadow-[0_0_20px_-3px_rgba(37,99,235,0.2)]"
                )}
              >
                {/* Left: Drag Handle, Checkbox, Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Drag Handle */}
                  <button
                    className="text-muted-foreground/60 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1 rounded transition shrink-0"
                    title="Sıralamak için sürükle"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleTask(task)}
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0",
                      isDone
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-muted border-border hover:border-slate-500 text-transparent"
                    )}
                    title={isDone ? "Görevi geri al" : "Tamamlandı olarak işaretle"}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  {/* Title & Badges Row */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3
                        onClick={() => openEditTaskModal(task)}
                        className={cn(
                          "text-sm font-bold text-foreground group-hover:text-blue-700 dark:text-blue-300 transition truncate cursor-pointer",
                          isDone && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </h3>

                      {/* Priority Badge */}
                      {task.mandatory ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Öncelikli
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          İsteğe Bağlı
                        </span>
                      )}
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      {/* Category Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border",
                          styling.bg,
                          styling.border,
                          styling.text
                        )}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: styling.color }}
                        />
                        {area?.name || "Genel"}
                      </span>

                      {/* Duration Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground/90 border border-border font-mono">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {task.minutes} dk
                      </span>

                      {/* Pool / Day Location Badge */}
                      {assignedDayObj ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 font-medium">
                          <CalendarIcon className="w-3 h-3 text-blue-400" />
                          {assignedDayObj.dayName} {assignedDayObj.dayNum} {assignedDayObj.monthName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-muted-foreground bg-muted border border-border">
                          <Layers className="w-3 h-3 text-muted-foreground/80" />
                          Esnek Havuz
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Modern Action Bar */}
                <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0">
                  {/* Düzenle */}
                  <button
                    onClick={() => openEditTaskModal(task)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-blue-600/20 text-foreground/90 hover:text-blue-700 dark:text-blue-300 border border-border hover:border-blue-500/30 text-xs font-medium transition flex items-center gap-1.5"
                    title="Görevi Düzenle"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-400" />
                    <span className="hidden sm:inline">Düzenle</span>
                  </button>

                  {/* Küçült */}
                  <button
                    onClick={() => handleShrinkTask(task)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-muted text-foreground/90 hover:text-foreground border border-border text-xs font-medium transition flex items-center gap-1"
                    title="Süreyi yarıya indir"
                  >
                    <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Küçült</span>
                  </button>

                  {/* Havuza Gönder / Güne Ata */}
                  {task.date ? (
                    <button
                      onClick={() => handlePoolTask(task)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-muted text-foreground/90 hover:text-foreground border border-border text-xs font-medium transition flex items-center gap-1"
                      title="Havuza Geri Gönder"
                    >
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Havuza</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setAssignDayTarget(task.id)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 hover:text-foreground border border-blue-500/30 text-xs font-medium transition flex items-center gap-1"
                      title="Haftanın bir gününe ata"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Güne Ata</span>
                    </button>
                  )}

                  {/* +1 Gün Ertele */}
                  <button
                    onClick={() => handlePostponeTask(task)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-muted text-foreground/90 hover:text-foreground border border-border text-xs font-medium transition flex items-center gap-1"
                    title="Sonraki güne ertele"
                  >
                    <MoveRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">+1 Gün</span>
                  </button>

                  {/* Bırak */}
                  <button
                    onClick={() => handleDropTask(task)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-medium transition flex items-center gap-1"
                    title="Görevi İptal Et / Bırak"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bırak</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Kanban / Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
          {filteredTasks.map((task) => {
            const area = state.areas.find((a) => a.id === task.areaId);
            const styling = getAreaStyling(task.areaId, area?.name);
            const isDone = task.status === "done";
            const assignedDayObj = task.date ? weekDays.find((d) => d.date === task.date) : null;

            return (
              <div
                key={task.id}
                className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.35)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                        styling.bg,
                        styling.border,
                        styling.text
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: styling.color }} />
                      {area?.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{task.minutes} dk</span>
                  </div>
                  <h4
                    onClick={() => openEditTaskModal(task)}
                    className={cn(
                      "text-sm font-bold text-foreground hover:text-blue-700 dark:text-blue-300 cursor-pointer",
                      isDone && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </h4>
                  {task.why && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.why}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold transition",
                        isDone ? "bg-blue-600 text-white" : "bg-muted text-foreground/90 hover:bg-muted"
                      )}
                    >
                      {isDone ? "Bitti" : "Tamamla"}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShrinkTask(task)}
                      className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted text-foreground/90"
                    >
                      Küçült
                    </button>
                    <button
                      onClick={() => handlePostponeTask(task)}
                      className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted text-foreground/90"
                    >
                      +1G
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Quick Add Strip / Summary */}
      <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            Toplam: <strong className="text-foreground">{filteredTasks.length} Görev</strong> ({plannedMinutes} dk)
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {completedTasks.length} Tamamlandı
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-emerald-400 font-semibold">Sprint Yükü Dengeli</span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-muted-foreground/80">Klavye Kısayolu:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-foreground/90">
            N
          </kbd>
          <span>ile yeni ekle</span>
        </div>
      </div>
    </section>
    {/* END: TaskPoolSection */}
    </>
  );
}
