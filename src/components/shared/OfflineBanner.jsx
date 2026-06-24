import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/theme';
import { getNetworkStatus, subscribeNetworkStatus } from '../../utils/cache';

export function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getNetworkStatus().then((status) => {
      if (isMounted) {
        setIsConnected(status.isConnected);
      }
    });

    const unsubscribe = subscribeNetworkStatus((status) => {
      setIsConnected(status.isConnected);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline - menampilkan data cache</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 16,
    backgroundColor: '#B91C1C',
  },
  text: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
});
