import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#0EA5E9', fontSize: 32, fontWeight: 'bold' }}>
        Leftover
      </Text>
      <Text style={{ color: '#fff', fontSize: 16, marginTop: 10 }}>
        App is loading!
      </Text>
    </View>
  );
}
