import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { supabase } from '@repo/ai-engine'; // Your shared Supabase client
import { GoogleGenerativeAI } from '@google/generative-ai'; // Direct AI import for the app

export default function AuditScreen() {
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!smsText) return Alert.alert("Error", "Please paste an SMS first!");
    
    setLoading(true);
    try {
      // 1. Initialize Gemini (Using your .env key)
      const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `Extract subscription details from this SMS: "${smsText}". 
      Return ONLY a JSON object with: name, amount (number), currency, and billing_cycle (monthly/yearly/one-time).`;

      const aiResult = await model.generateContent(prompt);
      const data = JSON.parse(aiResult.response.text().replace(/```json|```/g, ""));
      
      setResult(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "AI failed to read that SMS.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    
    const { error } = await supabase
      .from('subscriptions')
      .insert([{ 
        name: result.name, 
        amount: result.amount, 
        billing_cycle: result.billing_cycle || 'monthly' 
      }]);

    if (error) {
      Alert.alert("Database Error", error.message);
    } else {
      Alert.alert("Success!", `${result.name} subscription saved.`);
      setResult(null);
      setSmsText('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription Auditor</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Paste Bank SMS here..."
        multiline
        value={smsText}
        onChangeText={setSmsText}
      />

      <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze with Gemini</Text>}
      </TouchableOpacity>

      {/* The "Safe Guard" - Only shows when AI has a result */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Is this correct?</Text>
          <Text>Merchant: <Text style={{fontWeight: 'bold'}}>{result.name}</Text></Text>
          <Text>Amount: ₹{result.amount}</Text>
          <Text>Cycle: {result?.billing_cycle}</Text>
          
          <TouchableOpacity style={[styles.button, {backgroundColor: '#2e7d32', marginTop: 10}]} onPress={handleSave}>
            <Text style={styles.buttonText}>Confirm & Save to Supabase</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, height: 100, marginBottom: 20 },
  button: { backgroundColor: '#1a73e8', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  resultCard: { marginTop: 30, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 15, borderWidth: 1, borderColor: '#eee' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#2e7d32' }
});