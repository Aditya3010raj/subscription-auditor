import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@repo/ai-engine';
import { useIsFocused } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HistoryScreen() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchSubscriptions = async () => {
    setLoading(true);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    // Type Guard for TypeScript
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id) 
      .order('created_at', { ascending: false });

    if (!error) setSubscriptions(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert("Error", error.message);
          } 
        }
      ]
    );
  };

  useEffect(() => {
    if (isFocused) fetchSubscriptions();
  }, [isFocused]);

  const totalMonthly = subscriptions.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  return (
    <View style={styles.container}>
      {/* 1. Header Navigation config (Top Bar) */}
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'History',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15, padding: 5 }}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={22} color="#FF3B30" />
            </TouchableOpacity>
          ),
        }} 
      />

      {/* 2. Page Content Header (In-page Title + Logout Fallback) */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your Subscriptions</Text>
          {/* Fallback Logout button if the Top Bar one is hidden by Tabs */}
          <TouchableOpacity onPress={handleLogout} style={styles.inlineLogout}>
             <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#FF3B30" />
             <Text style={styles.logoutLabel}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.totalText}>Total Monthly: ₹{totalMonthly.toFixed(2)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
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
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: { marginBottom: 20, marginTop: 20 },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  inlineLogout: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF5F5', 
    padding: 8, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0'
  },
  logoutLabel: { color: '#FF3B30', fontWeight: '600', marginLeft: 5, fontSize: 14 },
  totalText: { fontSize: 18, color: '#2e7d32', fontWeight: '600', marginTop: 5 },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  merchantName: { fontSize: 18, fontWeight: '500', color: '#111' },
  date: { fontSize: 13, color: '#999', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8' },
  empty: { textAlign: 'center', marginTop: 100, color: '#888', fontSize: 16 }
});