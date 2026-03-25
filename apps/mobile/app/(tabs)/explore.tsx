import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '@repo/ai-engine';
import { useIsFocused } from '@react-navigation/native'; // To refresh when you switch tabs

export default function HistoryScreen() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // Detects when you land on this tab

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setSubscriptions(data || []);
    setLoading(false);
  };

  // Refresh list whenever the tab becomes active
  useEffect(() => {
    if (isFocused) fetchSubscriptions();
  }, [isFocused]);

  const totalMonthly = subscriptions.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Subscriptions</Text>
        <Text style={styles.totalText}>Total Monthly: ₹{totalMonthly.toFixed(2)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.merchantName}>{item.name}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.amount}>₹{item.amount}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No subscriptions found yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { marginBottom: 20, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  totalText: { fontSize: 18, color: '#2e7d32', fontWeight: '600', marginTop: 5 },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  merchantName: { fontSize: 18, fontWeight: '500' },
  date: { fontSize: 12, color: '#888' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8' },
  empty: { textAlign: 'center', marginTop: 100, color: '#888' }
});