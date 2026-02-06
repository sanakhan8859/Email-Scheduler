import React, { useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState('5000');
  const [hourlyLimit, setHourlyLimit] = useState('200');
  const [file, setFile] = useState<File | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Parse file to count emails
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
        setEmailCount(emails.length);
        toast.success(`Found ${emails.length} email addresses`);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please upload a recipient file');
      return;
    }
    
    if (!subject || !body) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!startTime) {
      toast.error('Please select a start time');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('recipientFile', file);
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('startTime', startTime);
      formData.append('delayBetweenEmails', delayBetweenEmails);
      formData.append('hourlyLimit', hourlyLimit);

      await onSubmit(formData);
      
      // Reset form
      setSubject('');
      setBody('');
      setStartTime('');
      setFile(null);
      setEmailCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose New Email" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <Input
          label="Subject"
          placeholder="Enter email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Body
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            rows={6}
            placeholder="Enter email body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipients (CSV/TXT file)
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose File
            </label>
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span className="text-primary-600 font-medium">({emailCount} emails)</span>
              </div>
            )}
          </div>
        </div>

        {/* Start Time */}
        <Input
          label="Start Time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Delay Between Emails */}
          <Input
            label="Delay Between Emails (ms)"
            type="number"
            value={delayBetweenEmails}
            onChange={(e) => setDelayBetweenEmails(e.target.value)}
            min="0"
            required
          />

          {/* Hourly Limit */}
          <Input
            label="Hourly Limit"
            type="number"
            value={hourlyLimit}
            onChange={(e) => setHourlyLimit(e.target.value)}
            min="1"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Schedule Emails
          </Button>
        </div>
      </form>
    </Modal>
  );
};
