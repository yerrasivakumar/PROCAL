import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardContent, Button, Select, MenuItem, Typography, Box } from '@mui/material';
import { Mic, MicOff, FileDown, User, Users, Trash2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';
import logo  from './Assets/Procal.jpg'
const recognizeVoice = (averagePitch) => {
  return averagePitch ? 'user1' : 'user2';
};

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentUser, setCurrentUser] = useState('user1');
  const [transcripts, setTranscripts] = useState({ user1: '', user2: '' });
  const [autoSwitch, setAutoSwitch] = useState(false);
  const recognitionRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContext.createAnalyser();

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
        })
        .catch((err) => console.error('Error accessing microphone:', err));

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Process results from Speech Recognition
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Auto-switch users based on voice pitch
        if (autoSwitch && analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const averagePitch = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const recognizedUser = recognizeVoice(averagePitch);
          setCurrentUser(recognizedUser);
        }

        // Update the current user's transcript, ensuring no 'undefined' on first entry
        if (finalTranscript) {
          setTranscripts((prev) => ({
            ...prev,
            [currentUser]: (prev[currentUser] || '') + finalTranscript,
          }));
        }
      };
    } else {
      console.error('Speech recognition not supported');
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentUser, autoSwitch]);

  // Toggle microphone listening state
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current?.start && recognitionRef.current?.status !== "listening") {
        recognitionRef.current.start();
      }
    }
    setIsListening(!isListening);
  };
  
  const handleUserChange = (value) => {
    setCurrentUser(value);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        if (recognitionRef.current?.start && recognitionRef.current?.status !== "listening") {
          recognitionRef.current.start();
        }
      }, 500); // Add a delay to ensure recognition restarts smoothly
    }
  };

  // Export to Word Document
  const exportToWord = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "PROCAL TECH Transcript", bold: true, size: 24 }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "User 1 Transcript", heading: 1 }),
            new Paragraph({ text: transcripts.user1 }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "User 2 Transcript", heading: 1 }),
            new Paragraph({ text: transcripts.user2 }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transcript.docx';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(0, 128, 128); // PROCAL TECH teal
    doc.text("PROCAL TECH Transcript", 20, 20);
    
    let yPosition = 40; // Track the y-position for placing text
    
    // Add User 1 transcript
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("User 1 Transcript", 20, yPosition);
    yPosition += 10; // Add space after the title
    
    doc.setFontSize(12);
    const user1Text = doc.splitTextToSize(transcripts.user1, 180);
    doc.text(user1Text, 20, yPosition);
    yPosition += user1Text.length * 6; // Approximate height based on text length
    
    // Add User 2 transcript
    doc.addPage(); // Add a new page for User 2
    yPosition = 20; // Reset yPosition for the new page
    
    doc.setFontSize(16);
    doc.text("User 2 Transcript", 20, yPosition);
    yPosition += 10; // Add space after the title
    
    doc.setFontSize(12);
    const user2Text = doc.splitTextToSize(transcripts.user2, 180);
    doc.text(user2Text, 20, yPosition);
    yPosition += user2Text.length * 6; // Approximate height based on text length
    
    // Save the PDF
    doc.save("transcript.pdf");
  };

  // Clear transcripts
  const clearTranscript = () => {
    setTranscripts({ user1: '', user2: '' });
  };

  return (
   <>
    <Card 
    sx={{
      width: '100%',
      maxWidth: 800,
      margin: 'auto',
      backgroundColor: 'white',
      marginTop: '2rem',
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)', // Custom shadow for added depth
      borderRadius: 2,
    }}
    elevation={3} >
      <CardHeader
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center',gap:"10px"  }}>
            <Mic sx={{ width: 32, height: 32, color: '#00796b' }} />
            <img src={logo} alt='logo' width={'250px'} height={'45px'}/>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Select
            value={currentUser}
            onChange={(e) => handleUserChange(e.target.value)}
            disabled={autoSwitch}
            sx={{ width: 180 }}
          >
            <MenuItem value="user1">User 1</MenuItem>
            <MenuItem value="user2">User 2</MenuItem>
          </Select>
          <Button
            variant={isListening ? 'contained' : 'contained'}
            color={isListening ? 'error' : 'success'}
            onClick={toggleListening}
            startIcon={isListening ? <MicOff /> : <Mic />}
          >
            {isListening ? 'Stop' : 'Start'} Recording
          </Button>
          <Button
            variant={autoSwitch ? 'outlined' : 'contained'}
            color={autoSwitch ? 'secondary' : 'primary'}
            onClick={() => setAutoSwitch(!autoSwitch)}
            startIcon={autoSwitch ? <Users /> : <User />}
          >
            {autoSwitch ? 'Auto' : 'Manual'} Switch
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={clearTranscript}
            startIcon={<Trash2 />}
          >
            Clear Transcript
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mb: 4, '@media (min-width:600px)': { gridTemplateColumns: '1fr 1fr' } }}>
  <Box
    sx={{
      padding: 2,
      borderRadius: 1,
      height: 200,
      overflowY: 'auto',
      backgroundColor: currentUser === 'user1' ? '#b2dfdb' : 'white', // Highlight if 'user1' is current
    }}
  >
    <Typography variant="h6">User 1 Transcript</Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{transcripts.user1}</Typography>
  </Box>
  
  <Box
    sx={{
      padding: 2,
      borderRadius: 1,
      height: 200,
      overflowY: 'auto',
      backgroundColor: currentUser === 'user2' ? '#b2dfdb' : 'white', // Highlight if 'user2' is current
    }}
  >
    <Typography variant="h6">User 2 Transcript</Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{transcripts.user2}</Typography>
  </Box>
</Box>


        <Box sx={{ display: 'flex', justifyContent:'flex-end', gap: 2 }}>
          <Button variant="contained" color="success" onClick={exportToWord} startIcon={<FileDown />}>Export Word</Button>
          <Button variant="contained" color="success" onClick={exportToPDF} startIcon={<FileDown />}>Export PDF</Button>
        </Box>
      </CardContent>
    </Card></>
  );
};

export default App;
