import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TaskWithRelations, Contact } from '@meeting-task-tool/shared';
import { format } from 'date-fns';

interface UserTasksModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: Contact | null;
    tasks: TaskWithRelations[];
    onTaskClick: (task: TaskWithRelations) => void;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-muted text-muted-foreground border-border',
};

const priorityColors: Record<string, string> = {
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function UserTasksModal({
    open,
    onOpenChange,
    user,
    tasks,
    onTaskClick,
}: UserTasksModalProps) {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {user.name.charAt(0)}
                        </div>
                        <span>Tasks for {user.name}</span>
                        <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {tasks.length}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-4">
                    <div className="space-y-3 py-4">
                        {tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No tasks assigned to this user.
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-start justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => onTaskClick(task)}
                                >
                                    <div className="space-y-1 flex-1 mr-4">
                                        <p className="text-sm font-medium leading-none">
                                            {task.description}
                                        </p>
                                        {task.deadline && (
                                            <p className="text-xs text-muted-foreground">
                                                Due {format(new Date(task.deadline), 'MMM d, yyyy')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[task.status] || statusColors.pending
                                                }`}
                                        >
                                            {task.status.replace('_', ' ')}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${priorityColors[task.priority] || priorityColors.medium
                                                }`}
                                        >
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
