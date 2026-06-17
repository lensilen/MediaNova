import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 54,
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
    marginBottom: 22,
  },
  brand: {
    fontSize: 18,
    fontWeight: '900',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    marginBottom: 14,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
  },
  email: {
    marginTop: 5,
    fontSize: 13,
  },
  bio: {
    maxWidth: 280,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
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
    borderRadius: 8,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
});
