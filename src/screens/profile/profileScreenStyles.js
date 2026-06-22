import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 120,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brand: {
    fontSize: 18,
    fontWeight: '900',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  topBarSpacer: {
    width: 40,
    height: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 46,
    marginBottom: 14,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
  },
  email: {
    marginTop: 5,
    fontSize: 13,
  },
  bio: {
    maxWidth: 310,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  location: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statValue: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  error: {
    color: '#FCA5A5',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '900',
  },
  tabLine: {
    position: 'absolute',
    bottom: -1,
    width: 22,
    height: 2,
    borderRadius: 1,
  },
});
