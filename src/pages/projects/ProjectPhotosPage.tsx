import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Camera, Upload, MapPin, Calendar, Tag, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ProjectPhoto, PhotoType } from '@/types/types';

export default function ProjectPhotosPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadPhotoType, setUploadPhotoType] = useState<PhotoType>('progress');
  const [uploadTags, setUploadTags] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchPhotos();
    }
  }, [projectId]);

  const fetchPhotos = async () => {
    if (!projectId || !profile?.firm_id) return;

    try {
      const { data, error } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .eq('firm_id', profile.firm_id)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Try to get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success('GPS location captured');
        },
        (error) => {
          console.error('GPS error:', error);
          toast.warning('Could not capture GPS location');
        }
      );
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !projectId || !profile?.firm_id) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      // Insert photo record
      const { error: insertError } = await supabase
        .from('project_photos')
        .insert({
          firm_id: profile.firm_id,
          project_id: projectId,
          uploaded_by: profile.id,
          title: uploadTitle || 'Untitled Photo',
          description: uploadDescription || null,
          photo_url: urlData.publicUrl,
          photo_type: uploadPhotoType,
          latitude: gpsLocation?.lat || null,
          longitude: gpsLocation?.lng || null,
          location_name: locationName || null,
          taken_at: new Date().toISOString(),
          tags: uploadTags ? uploadTags.split(',').map(t => t.trim()) : null,
        });

      if (insertError) throw insertError;

      toast.success('Photo uploaded successfully');
      setShowUploadDialog(false);
      resetUploadForm();
      fetchPhotos();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadPhotoType('progress');
    setUploadTags('');
    setGpsLocation(null);
    setLocationName('');
  };

  const handlePhotoClick = (photo: ProjectPhoto) => {
    setSelectedPhoto(photo);
    setShowDetailDialog(true);
  };

  const getPhotoTypeColor = (type: PhotoType) => {
    const colors = {
      progress: 'bg-blue-100 text-blue-800',
      before: 'bg-green-100 text-green-800',
      after: 'bg-purple-100 text-purple-800',
      issue: 'bg-red-100 text-red-800',
      completion: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-col gap-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project Photos</h1>
              <p className="text-muted-foreground">Document project progress with photos</p>
            </div>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Camera className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No photos uploaded yet</p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Camera className="mr-2 h-4 w-4" />
                Upload First Photo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handlePhotoClick(photo)}>
                <div className="aspect-video relative">
                  <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhotoTypeColor(photo.photo_type)}`}>
                      {photo.photo_type}
                    </span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{photo.title}</CardTitle>
                  {photo.description && (
                    <CardDescription className="line-clamp-2">{photo.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {photo.taken_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(photo.taken_at).toLocaleDateString()}
                      </div>
                    )}
                    {photo.location_name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {photo.location_name}
                      </div>
                    )}
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {photo.tags.slice(0, 2).join(', ')}
                        {photo.tags.length > 2 && ` +${photo.tags.length - 2}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
            <DialogDescription>Add a photo to document project progress</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <Label>Photo</Label>
              <div className="mt-2">
                {uploadPreview ? (
                  <div className="relative">
                    <img src={uploadPreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Foundation Pour - East Wing"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Add details about this photo..."
                rows={3}
              />
            </div>

            {/* Photo Type */}
            <div>
              <Label htmlFor="photo-type">Photo Type</Label>
              <Select value={uploadPhotoType} onValueChange={(value) => setUploadPhotoType(value as PhotoType)}>
                <SelectTrigger id="photo-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location Name</Label>
              <Input
                id="location"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Building A - 2nd Floor"
              />
              {gpsLocation && (
                <p className="text-xs text-muted-foreground mt-1">
                  GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="e.g., concrete, foundation, inspection"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!uploadFile || !uploadTitle || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.title}</DialogTitle>
            <DialogDescription>
              {selectedPhoto?.taken_at && new Date(selectedPhoto.taken_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="space-y-4">
              <img src={selectedPhoto.photo_url} alt={selectedPhoto.title} className="w-full rounded-lg" />
              
              {selectedPhoto.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedPhoto.description}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhotoTypeColor(selectedPhoto.photo_type)}`}>
                        {selectedPhoto.photo_type}
                      </span>
                    </div>
                    {selectedPhoto.location_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{selectedPhoto.location_name}</span>
                      </div>
                    )}
                    {selectedPhoto.latitude && selectedPhoto.longitude && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GPS:</span>
                        <span className="text-xs">{selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-muted rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
