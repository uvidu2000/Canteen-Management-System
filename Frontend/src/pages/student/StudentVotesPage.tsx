import { ArrowLeft, Check, Plus, StopCircle, Trash2, Users, Vote } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { queryKeys } from "@/lib/queryKeys";
import { canteenService } from "@/services/canteenService";
import type { FoodItem, FoodVote } from "@/types/canteen";
import { formatDateTime, formatPrice } from "@/utils/canteen";
import { cn } from "@/utils/cn";

export function StudentVotesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("Lunch vote");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFoodItemId, setSelectedFoodItemId] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [foodItemIds, setFoodItemIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const studentsQuery = useQuery({
    queryKey: queryKeys.registeredStudents,
    queryFn: canteenService.listRegisteredStudents
  });
  const foodItemsQuery = useQuery({
    queryKey: queryKeys.foodItems,
    queryFn: canteenService.listFoodItems
  });
  const votesQuery = useQuery({
    queryKey: queryKeys.votes,
    queryFn: canteenService.listVotes
  });

  const students = studentsQuery.data ?? [];
  const foodItems = foodItemsQuery.data ?? [];
  const votes = votesQuery.data ?? [];
  const availableFoodItems = useMemo(
    () => foodItems.filter((item) => item.stock > 0),
    [foodItems]
  );

  const createVoteMutation = useMutation({
    mutationFn: canteenService.createVote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.votes });
      setTitle("Lunch vote");
      setParticipantIds([]);
      setFoodItemIds([]);
      setSelectedStudentId("");
      setSelectedFoodItemId("");
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Could not create vote.");
    }
  });
  const submitVoteMutation = useMutation({
    mutationFn: ({ voteId, foodItemId }: { voteId: string; foodItemId: string }) =>
      canteenService.submitVote(voteId, foodItemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.votes });
    }
  });
  const endVoteMutation = useMutation({
    mutationFn: canteenService.endVote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.votes });
    }
  });

  const selectedParticipants = participantIds
    .map((identifier) => students.find((student) => student.identifier === identifier))
    .filter(Boolean);
  const selectedFoodItems = foodItemIds
    .map((foodItemId) => foodItems.find((item) => item.id === foodItemId))
    .filter((item): item is FoodItem => Boolean(item));

  function addParticipant() {
    if (!selectedStudentId || participantIds.includes(selectedStudentId)) {
      return;
    }

    setParticipantIds((currentIds) => [...currentIds, selectedStudentId]);
    setSelectedStudentId("");
  }

  function addFoodItem() {
    if (!selectedFoodItemId || foodItemIds.includes(selectedFoodItemId)) {
      return;
    }

    setFoodItemIds((currentIds) => [...currentIds, selectedFoodItemId]);
    setSelectedFoodItemId("");
  }

  function createVote() {
    if (!participantIds.length) {
      setFormError("Add at least one student to the vote.");
      return;
    }

    if (foodItemIds.length < 2) {
      setFormError("Add at least two available food items.");
      return;
    }

    createVoteMutation.mutate({
      title: title.trim() || "Food vote",
      participantIdentifiers: participantIds,
      foodItemIds
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Student Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal text-foreground">
              Food Voting
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a group vote, choose available dishes, and let added students pick one.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.home)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Menu
          </Button>
        </header>

        <section className="mb-5 rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              New Vote
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal">Plan with classmates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only registered students and currently available food items can be added.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="voteTitle"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Vote title
                </label>
                <Input
                  id="voteTitle"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 h-11"
                  placeholder="Lunch vote"
                />
              </div>

              <div>
                <label
                  htmlFor="studentSelector"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Add students
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select
                    id="studentSelector"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select a student</option>
                    {students
                      .filter((student) => !participantIds.includes(student.identifier))
                      .map((student) => (
                        <option key={student.identifier} value={student.identifier}>
                          {student.name} ({student.identifier})
                        </option>
                      ))}
                  </select>
                  <Button type="button" onClick={addParticipant} disabled={!selectedStudentId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="foodSelector"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Add food items
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select
                    id="foodSelector"
                    value={selectedFoodItemId}
                    onChange={(event) => setSelectedFoodItemId(event.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select a food item</option>
                    {availableFoodItems
                      .filter((item) => !foodItemIds.includes(item.id))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.stock} left)
                        </option>
                      ))}
                  </select>
                  <Button type="button" onClick={addFoodItem} disabled={!selectedFoodItemId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <SelectionPanel
                title="Added students"
                emptyText="No students added yet."
                items={selectedParticipants.map((student) => ({
                  id: student?.identifier ?? "",
                  label: `${student?.name} (${student?.identifier})`
                }))}
                onRemove={(identifier) =>
                  setParticipantIds((currentIds) => currentIds.filter((id) => id !== identifier))
                }
              />
              <SelectionPanel
                title="Food options"
                emptyText="No food items added yet."
                items={selectedFoodItems.map((item) => ({
                  id: item.id,
                  label: `${item.name} - ${formatPrice(item.price)}`
                }))}
                onRemove={(foodItemId) =>
                  setFoodItemIds((currentIds) => currentIds.filter((id) => id !== foodItemId))
                }
              />
            </div>
          </div>

          {formError ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end border-t pt-4">
            <Button type="button" onClick={createVote} disabled={createVoteMutation.isPending}>
              <Vote className="mr-2 h-4 w-4" />
              {createVoteMutation.isPending ? "Creating Vote" : "Create Vote"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Active Votes
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-normal">Votes you are added to</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vote results update for every participant after each selection.
              </p>
            </div>
            <div className="rounded-lg border bg-background px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-xl font-bold">{votes.length}</p>
            </div>
          </div>

          {votesQuery.isLoading ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Loading votes</p>
            </div>
          ) : null}

          {!votesQuery.isLoading && votes.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {votes.map((foodVote) => (
                <VoteCard
                  key={foodVote.id}
                  vote={foodVote}
                  isEnding={endVoteMutation.isPending}
                  isSubmitting={submitVoteMutation.isPending}
                  onEnd={() => endVoteMutation.mutate(foodVote.id)}
                  onSubmit={(foodItemId) =>
                    submitVoteMutation.mutate({ voteId: foodVote.id, foodItemId })
                  }
                />
              ))}
            </div>
          ) : null}

          {!votesQuery.isLoading && !votes.length ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No votes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a vote or ask a classmate to add you to one.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

type SelectionPanelProps = {
  title: string;
  emptyText: string;
  items: Array<{ id: string; label: string }>;
  onRemove: (id: string) => void;
};

function SelectionPanel({ title, emptyText, items, onRemove }: SelectionPanelProps) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      {items.length ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm font-medium">{item.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
    </div>
  );
}

type VoteCardProps = {
  vote: FoodVote;
  isEnding: boolean;
  isSubmitting: boolean;
  onEnd: () => void;
  onSubmit: (foodItemId: string) => void;
};

function VoteCard({ vote, isEnding, isSubmitting, onEnd, onSubmit }: VoteCardProps) {
  const totalVotes = vote.options.reduce((total, option) => total + option.voteCount, 0);
  const isEnded = vote.status === "Ended";

  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{vote.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Created by {vote.creatorName} - {formatDateTime(vote.createdAt)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {vote.participants.length} participants
          </p>
          {vote.endedAt ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Ended at {formatDateTime(vote.endedAt)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEnded ? (
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Ended
            </span>
          ) : vote.currentUserVoteFoodItemId ? (
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Voted
            </span>
          ) : (
            <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              Pending vote
            </span>
          )}
          {vote.canEnd ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEnd}
              disabled={isEnding}
              className="text-destructive hover:text-destructive"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              {isEnding ? "Ending" : "End Vote"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {vote.options.map((option) => {
          const isSelected = vote.currentUserVoteFoodItemId === option.foodItemId;
          const percentage = totalVotes ? Math.round((option.voteCount / totalVotes) * 100) : 0;

          return (
            <div
              key={option.foodItemId}
              className={cn(
                "rounded-lg border bg-card p-3",
                isSelected && "border-primary bg-primary/5"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <img
                  src={option.imageUrl}
                  alt={option.foodName}
                  className="h-20 w-full rounded-md object-cover sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{option.foodName}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.category} - {formatPrice(option.price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{option.voteCount} votes</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{percentage}% of votes</p>
                </div>
                <Button
                  type="button"
                  variant={isSelected ? "outline" : "default"}
                  size="sm"
                  disabled={isSubmitting || isEnded}
                  onClick={() => onSubmit(option.foodItemId)}
                  className="shrink-0"
                >
                  {isEnded && isSelected ? "Final choice" : isEnded ? "Ended" : isSelected ? "Selected" : "Vote"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
