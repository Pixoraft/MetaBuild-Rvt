import { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet, Code } from "lucide-react";
import { fetchDayData, exportToJSON, exportToCSV, exportToText, exportMultipleDays } from "@/lib/exportService";
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
  children: React.ReactNode;
}

export function ExportModal({ children }: ExportModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [exportType, setExportType] = useState<'single' | 'range'>('single');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt'>('txt');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleExport = async () => {
    setIsLoading(true);
    try {
      if (exportType === 'single') {
        const data = await fetchDayData(selectedDate);
        switch (exportFormat) {
          case 'json':
            exportToJSON(data);
            break;
          case 'csv':
            exportToCSV(data);
            break;
          case 'txt':
            exportToText(data);
            break;
        }
        toast({ title: "Export completed successfully!" });
      } else {
        await exportMultipleDays(startDate, endDate, exportFormat);
        toast({ title: "Multi-day export completed successfully!" });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: "Export failed", 
        description: "Please try again or check your internet connection.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickDateRange = (type: 'week' | 'month' | 'last7' | 'last30') => {
    const today = new Date();
    switch (type) {
      case 'week':
        setStartDate(format(startOfWeek(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(today), 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'last7':
        setStartDate(format(subDays(today, 6), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'last30':
        setStartDate(format(subDays(today, 29), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Productivity Data</DialogTitle>
          <DialogDescription>
            Export your productivity data in various formats for backup or analysis.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={exportType} onValueChange={(value) => setExportType(value as 'single' | 'range')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Day</TabsTrigger>
            <TabsTrigger value="range">Date Range</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </TabsContent>

          <TabsContent value="range" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickDateRange('last7')}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickDateRange('week')}
                >
                  This Week
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickDateRange('last30')}
                >
                  Last 30 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuickDateRange('month')}
                >
                  This Month
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <Label>Export Format</Label>
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as 'json' | 'csv' | 'txt')}>
            <div className="space-y-2">
              <Card className={`cursor-pointer transition-colors ${exportFormat === 'txt' ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="txt" id="txt" />
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <Label htmlFor="txt" className="cursor-pointer font-medium">
                        Text Report (.txt)
                      </Label>
                      <p className="text-xs text-gray-500">Human-readable daily report with emojis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`cursor-pointer transition-colors ${exportFormat === 'csv' ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="csv" id="csv" />
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <Label htmlFor="csv" className="cursor-pointer font-medium">
                        Spreadsheet (.csv)
                      </Label>
                      <p className="text-xs text-gray-500">Structured data for Excel or Google Sheets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`cursor-pointer transition-colors ${exportFormat === 'json' ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="json" id="json" />
                    <Code className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <Label htmlFor="json" className="cursor-pointer font-medium">
                        JSON Data (.json)
                      </Label>
                      <p className="text-xs text-gray-500">Raw data for developers and integrations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            onClick={handleExport} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isLoading ? 'Exporting...' : 'Export'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}