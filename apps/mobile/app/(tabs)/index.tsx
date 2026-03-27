import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '@repo/ai-engine'; 
import { GoogleGenerativeAI } from '@google/generative-ai'; 

export default function AuditScreen() {
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!smsText) return Alert.alert("Error", "Please paste an SMS first!");
    
    setLoading(true);
    try {
      // 1. Initialize Gemini
      const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // Updated to a stable model name

      const prompt = `Extract subscription details from this SMS: "${smsText}". 
      Return ONLY a raw JSON object (no markdown, no backticks) with: name, amount (number), currency, and billing_cycle (monthly/yearly/one-time).`;

      const aiResult = await model.generateContent(prompt);
      const textResponse = aiResult.response.text();
      
      // Clean the response in case Gemini adds markdown backticks
      const cleanJson = textResponse.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      setResult(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "AI failed to read that SMS. Check your API key or SMS format.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      setLoading(true);
      
      // 1. Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Authentication Error", "Please log in again to save.");
        return;
      }

      // 2. Insert with the User ID and AI Results
      const { error } = await supabase
        .from('subscriptions')
        .insert([
          { 
            name: result.name, 
            amount: result.amount, 
            billing_cycle: result.billing_cycle || 'monthly',
            user_id: user.id // Tagging the record to YOU
          }
        ]);

      if (error) {
        throw error;
      }

      Alert.alert("Success!", `${result.name} subscription saved to your account.`);
      setResult(null);
      setSmsText('');
    } catch (error: any) {
      Alert.alert("Database Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Subscription Auditor</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Paste Bank SMS here (e.g., 'Debited ₹149 for Spotify...')"
        multiline
        value={smsText}
        onChangeText={setSmsText}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: loading ? '#ccc' : '#1a73e8' }]} 
        onPress={handleAnalyze} 
        disabled={loading}
      >
        {loading && !result ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze with Gemini</Text>}
      </TouchableOpacity>

      {/* Result Card: Only shows when AI successfully parses data */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Is this correct?</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Merchant:</Text>
            <Text style={styles.value}>{result.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>₹{result.amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cycle:</Text>
            <Text style={styles.value}>{result.billing_cycle}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#2e7d32', marginTop: 20 }]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm & Save to Supabase</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginTop: 15, alignItems: 'center' }} 
            onPress={() => setResult(null)}
          >
            <Text style={{ color: '#d32f2f' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 12, height: 120, marginBottom: 20, fontSize: 16, textAlignVertical: 'top' },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultCard: { marginTop: 30, padding: 20, backgroundColor: '#f0f7ff', borderRadius: 20, borderWidth: 1, borderColor: '#d0e3ff' },
  resultTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1a73e8', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 16, color: '#666' },
  value: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});