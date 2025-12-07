'use client';

import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { contactsApi } from '@/lib/api';
import { Plus, RefreshCw, Users, Mail, Briefcase, Edit2, Trash2, Building2, Globe } from 'lucide-react';
import type { Contact } from '@meeting-task-tool/shared';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    role: z.string().optional(),
    contactType: z.enum(['internal', 'external']).default('internal'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

// Extended contact type to include contactType
type ContactWithType = Contact & { contactType?: 'internal' | 'external' };

export default function ContactsPage() {
    const [contacts, setContacts] = useState<ContactWithType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingContact, setEditingContact] = useState<ContactWithType | null>(null);
    const [deletingContact, setDeletingContact] = useState<ContactWithType | null>(null);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            role: '',
            contactType: 'internal',
        },
    });

    const loadContacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await contactsApi.list();
            setContacts(response.contacts || []);
        } catch (err: any) {
            setError(err?.error || 'Failed to load contacts');
            setContacts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    const openCreateModal = () => {
        setEditingContact(null);
        form.reset({ name: '', email: '', role: '', contactType: 'internal' });
        setIsModalOpen(true);
    };

    const openEditModal = (contact: ContactWithType) => {
        setEditingContact(contact);
        form.reset({
            name: contact.name,
            email: contact.email || '',
            role: contact.role || '',
            contactType: contact.contactType || 'internal',
        });
        setIsModalOpen(true);
    };

    const onSubmit = async (data: ContactFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingContact) {
                // Update existing contact
                await contactsApi.update(editingContact.id, {
                    name: data.name,
                    email: data.email || undefined,
                    role: data.role || undefined,
                });
            } else {
                // Create new contact
                await contactsApi.create({
                    name: data.name,
                    email: data.email || undefined,
                    role: data.role || undefined,
                });
            }
            form.reset();
            setIsModalOpen(false);
            setEditingContact(null);
            loadContacts();
        } catch (err: any) {
            setError(err?.error || 'Failed to save contact');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingContact) return;

        try {
            await contactsApi.delete(deletingContact.id);
            setDeletingContact(null);
            loadContacts();
        } catch (err: any) {
            setError(err?.error || 'Failed to delete contact');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                    <p className="text-gray-600 mt-1">Manage people you can assign tasks to</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={loadContacts} disabled={isLoading} className="flex items-center space-x-1">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                    <Dialog open={isModalOpen} onOpenChange={(open) => {
                        setIsModalOpen(open);
                        if (!open) {
                            setEditingContact(null);
                            form.reset();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center space-x-1" onClick={openCreateModal}>
                                <Plus className="h-4 w-4" />
                                <span>Add Contact</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingContact
                                        ? 'Update the contact information below.'
                                        : 'Add a person to assign tasks to them.'}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" type="email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Developer, Manager, etc." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contactType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>Contact Type</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex gap-6"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="internal" id="internal" />
                                                            <Label htmlFor="internal" className="flex items-center gap-1.5 cursor-pointer">
                                                                <Building2 className="h-4 w-4 text-blue-600" />
                                                                Internal Team
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="external" id="external" />
                                                            <Label htmlFor="external" className="flex items-center gap-1.5 cursor-pointer">
                                                                <Globe className="h-4 w-4 text-purple-600" />
                                                                External Contractor
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setEditingContact(null);
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting
                                                ? (editingContact ? 'Saving...' : 'Adding...')
                                                : (editingContact ? 'Save Changes' : 'Add Contact')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Contacts</CardTitle>
                    <CardDescription>People available for task assignment</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                            <Button onClick={loadContacts} variant="outline" className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="mt-4">No contacts yet. Add someone to get started!</p>
                            <Button onClick={openCreateModal} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Contact
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contacts.map((contact) => (
                                <Card key={contact.id} className={`group relative ${contact.contactType === 'external' ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start space-x-4">
                                            <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${contact.contactType === 'external' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                                <span className={`font-semibold text-lg ${contact.contactType === 'external' ? 'text-purple-600' : 'text-blue-600'}`}>
                                                    {contact.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                                                    {contact.contactType === 'external' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                            <Globe className="h-3 w-3" />
                                                            External
                                                        </span>
                                                    )}
                                                </div>
                                                {contact.email && (
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        <span className="truncate">{contact.email}</span>
                                                    </div>
                                                )}
                                                {contact.role && (
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        <span>{contact.role}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditModal(contact)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeletingContact(contact)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {deletingContact?.name}? This action cannot be undone.
                            Tasks assigned to this contact will become unassigned.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
