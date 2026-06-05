import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/contexts/CommentContext';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CommentableEditor } from '@/components/shared/CommentableEditor';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { toast } from 'sonner';
import { createReport, updateReport, getReport, getProjects, createAuditLog, generateAIText } from '@/lib/api';
import { supabase } from '@/db/supabase';
import type { Project, ReportStatus } from '@/types/types';
import { Loader2, ArrowLeft, Upload, X, Sparkles, AlertCircle } from 'lucide-react';

interface ReportFormData {
  project_id: string;
  title: string;
  field_notes: string;
  narrative: string;
  status: ReportStatus;
}

const DISCLAIMER = "This field review report is based on visual observations made during the site visit. It does not constitute a comprehensive inspection or warranty of the work performed. Any recommendations should be verified by qualified professionals before implementation.";

export default function ReportFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { profile } = useAuth();
  const { loadComments } = useComments();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const form = useForm<ReportFormData>({
    defaultValues: {
      project_id: '',
      title: '',
      field_notes: '',
      narrative: '',
      status: 'draft',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.firm_id) return;
      try {
        const projectsData = await getProjects(profile.firm_id);
        setProjects(projectsData);

        if (isEdit && id) {
          // Load report data
          const report = await getReport(id);
          if (report) {
            form.reset({
              project_id: report.project_id,
              title: report.title,
              field_notes: report.field_notes || '',
              narrative: report.narrative || '',
              status: report.status,
            });
            setSelectedProject(report.project || null);
            setPhotos(report.photos || []);
            
            // Load comments for this report
            loadComments(id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [profile, isEdit, id, form]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    if (project) {
      form.setValue('title', `Field Review Report - ${project.name}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!profile?.id) return;

    setUploading(true);
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        // Validate file size (1MB limit)
        if (file.size > 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 1MB.`);
          return null;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file.`);
          return null;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('report-photos')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);
      
      setPhotos(prev => [...prev, ...validUrls]);
      toast.success(`${validUrls.length} photo(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  }, [profile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 1024 * 1024, // 1MB
  });

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateNarrative = async () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    const fieldNotes = form.getValues('field_notes');
    if (!fieldNotes || fieldNotes.trim().length < 10) {
      toast.error('Please enter field notes first (at least 10 characters)');
      return;
    }

    setGeneratingAI(true);
    try {
      const narrative = await generateAIText(
        'report_narrative',
        fieldNotes,
        {
          projectName: selectedProject.name,
          clientName: selectedProject.client?.name,
          reportTitle: form.getValues('title'),
        }
      );
      form.setValue('narrative', narrative);
      toast.success('Professional narrative generated');
    } catch (error) {
      console.error('Error generating narrative:', error);
      toast.error('Failed to generate narrative');
    } finally {
      setGeneratingAI(false);
    }
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!profile?.firm_id || !profile?.id || !selectedProject) {
      toast.error('Missing required information');
      return;
    }

    if (photos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        project_id: data.project_id,
        client_id: selectedProject.client_id,
        title: data.title,
        field_notes: data.field_notes || null,
        narrative: data.narrative || null,
        photos,
        status: data.status,
        disclaimer: DISCLAIMER,
        approved_at: null,
        approved_by: null,
        sent_at: null,
        firm_id: profile.firm_id,
        created_by: profile.id,
      };

      let report;
      if (isEdit && id) {
        report = await updateReport(id, reportData);
        await createAuditLog({ firm_id: profile.firm_id,
          entity_type: 'report',
          entity_id: id,
          action: 'updated',
          details: { status: data.status },
          user_id: profile.id,
        });
        toast.success('Report updated successfully');
      } else {
        report = await createReport(reportData);
        await createAuditLog({ firm_id: profile.firm_id,
          entity_type: 'report',
          entity_id: report.id,
          action: 'created',
          details: { title: data.title },
          user_id: profile.id,
        });
        toast.success('Report created successfully');
      }

      navigate(`/reports/${report.id}`);
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="page-title">
          {isEdit ? 'Edit Field Review Report' : 'Create New Field Review Report'}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="content-spacing">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-xl">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="form-spacing">
              <FormField
                control={form.control}
                name="project_id"
                rules={{ required: 'Project is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleProjectChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} - {project.client?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter report title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-xl">Field Notes & Narrative</CardTitle>
            </CardHeader>
            <CardContent className="form-spacing">
              <FormField
                control={form.control}
                name="field_notes"
                rules={{ required: 'Field notes are required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Notes (Raw Observations)</FormLabel>
                    <FormControl>
                      {isEdit && id ? (
                        <ErrorBoundary
                          fallback={
                            <Textarea
                              placeholder="Enter your raw field observations, notes, and findings..."
                              rows={6}
                              {...field}
                            />
                          }
                          onError={(error) => {
                            console.error('CommentableEditor error:', error);
                            toast.error('Commenting unavailable, using standard mode');
                          }}
                        >
                          <CommentableEditor
                            documentId={id}
                            documentType="report"
                            fieldName="field_notes"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter your raw field observations, notes, and findings..."
                            rows={6}
                            isCollaborative={true}
                          />
                        </ErrorBoundary>
                      ) : (
                        <Textarea
                          placeholder="Enter your raw field observations, notes, and findings..."
                          rows={6}
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateNarrative}
                  disabled={generatingAI}
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Professional Narrative
                    </>
                  )}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="narrative"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Narrative</FormLabel>
                    <FormControl>
                      {isEdit && id ? (
                        <ErrorBoundary
                          fallback={
                            <Textarea
                              placeholder="AI-generated professional narrative will appear here..."
                              rows={8}
                              {...field}
                            />
                          }
                          onError={(error) => {
                            console.error('CommentableEditor error:', error);
                            toast.error('Commenting unavailable, using standard mode');
                          }}
                        >
                          <CommentableEditor
                            documentId={id}
                            documentType="report"
                            fieldName="narrative"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="AI-generated professional narrative will appear here..."
                            rows={8}
                            isCollaborative={true}
                          />
                        </ErrorBoundary>
                      ) : (
                        <Textarea
                          placeholder="AI-generated professional narrative will appear here..."
                          rows={8}
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-xl">Photos</CardTitle>
            </CardHeader>
            <CardContent className="form-spacing">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {uploading ? (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                ) : isDragActive ? (
                  <p className="text-sm text-primary">Drop photos here...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">
                      Drag & drop photos here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, WEBP up to 1MB
                    </p>
                  </>
                )}
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Report photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-enhanced border-info/20 bg-info/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-info mt-0.5" />
                <div>
                  <CardTitle className="text-xl">Disclaimer</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    This disclaimer will be automatically included in the report
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {DISCLAIMER}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Report' : 'Create Report'
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/reports')}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
