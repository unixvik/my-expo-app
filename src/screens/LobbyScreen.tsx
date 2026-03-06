import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, FlatList,
    Switch, ScrollView, Animated, LayoutAnimation, Platform, UIManager,
    ImageBackground, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
    Search, Lock, Users, Trophy, Layers, Settings,
    Plus, Minus, Play, Eye
} from 'lucide-react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── 🎨 THEME COLORS (Matches your CSS) ───
const THEME = {
    felt: '#1a3d2b',
    feltDark: '#0f2418',
    gold: '#c9933a',
    goldBright: '#ffd770',
    ivory: '#f5edd8',
    ivoryDim: '#c8b98a',
    red: '#c0392b',
    teal: '#1abc9c',
    darkCard: 'rgba(0,0,0,0.35)',
};

// ─── 🧩 REUSABLE DOPAMINE COMPONENTS ───

// A button that scales and vibrates on press
const DopamineButton = ({ onPress, children, className, style, disabled }: any) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
    };

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress && onPress();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled}
            style={[{ transform: [{ scale: scaleValue }] }, style]}
            className={className}
        >
            {children}
        </TouchableOpacity>
    );
};

// A stepper input (- 12 +)
const Stepper = ({ value, min, max, step = 1, onChange, suffix = '' }: any) => {
    const handleChange = (delta: number) => {
        const next = Math.min(max, Math.max(min, value + delta));
        if (next !== value) {
            Haptics.selectionAsync(); // Subtle click feel
            onChange(next);
        }
    };

    return (
        <View className="flex-row items-center bg-black/30 border border-[#c9933a]/30 rounded-lg overflow-hidden h-12">
            <TouchableOpacity onPress={() => handleChange(-step)} className="w-10 h-full items-center justify-center bg-[#c9933a]/10 active:bg-[#c9933a]/30">
                <Minus size={16} color={THEME.gold} />
            </TouchableOpacity>
            <View className="flex-1 items-center justify-center border-l border-r border-[#c9933a]/20 h-full">
                <Text className="text-[#f5edd8] font-bold text-lg font-bebas">
                    {value}{suffix}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleChange(step)} className="w-10 h-full items-center justify-center bg-[#c9933a]/10 active:bg-[#c9933a]/30">
                <Plus size={16} color={THEME.gold} />
            </TouchableOpacity>
        </View>
    );
};

// ─── 🏠 MAIN COMPONENT ───

export default function LobbyLandscape() {
    // State
    const [mode, setMode] = useState<'normal' | 'extended'>('normal');
    const [form, setForm] = useState({
        name: '',
        isPrivate: false,
        players: 4,
        points: 300,
        decks: 1,
        timer: false,
    });
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    // Animation for Extended Mode
    const toggleMode = (newMode: 'normal' | 'extended') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMode(newMode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // Mock Data
    const ROOMS = [
        { id: '1', name: "Midnight Shuffle", players: 3, max: 4, status: 'waiting', private: false, pts: 300 },
        { id: '2', name: "High Rollers 🏆", players: 5, max: 6, status: 'playing', private: false, pts: 500 },
        { id: '3', name: "Secret Society", players: 2, max: 4, status: 'waiting', private: true, pts: 300 },
        { id: '4', name: "Casual Friday", players: 1, max: 4, status: 'waiting', private: false, pts: 300 },
        { id: '5', name: "Bot Farm", players: 8, max: 8, status: 'playing', private: false, pts: 1000 },
    ];

    return (
        <View className="flex-1 bg-[#0f2418]">
            <StatusBar hidden />

            {/* 1. BACKGROUND GRADIENT & TEXTURE */}
            <LinearGradient
                colors={['#1a3d2b', '#0f2418']}
                style={{ position: 'absolute', inset: 0 }}
            />

            {/* 2. SUIT WATERMARKS (Decorative) */}
            <View className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
                <Text style={{ fontSize: 200, position: 'absolute', top: -40, left: -20, color: THEME.gold, transform: [{ rotate: '-10deg' }] }}>♠</Text>
                <Text style={{ fontSize: 200, position: 'absolute', bottom: -40, right: 20, color: THEME.gold, transform: [{ rotate: '10deg' }] }}>♦</Text>
            </View>

            <View className="flex-1 flex-row p-6 gap-6 max-w-7xl mx-auto w-full">

                {/* ════ LEFT COLUMN: CREATE ROOM (Flex 0.4) ════ */}
                <View className="flex-[0.4] bg-[#1a3d2b]/90 border border-[#c9933a]/40 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <View className="p-4 border-b border-[#c9933a]/30 flex-row items-center gap-3 bg-black/20">
                        <View className="w-8 h-8 rounded bg-[#c9933a]/20 items-center justify-center">
                            <Plus size={18} color={THEME.gold} />
                        </View>
                        <Text className="text-[#e8b96a] font-serif font-bold text-xl">Create Room</Text>
                    </View>

                    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>

                        {/* Mode Toggles */}
                        <View className="flex-row bg-black/30 p-1 rounded-xl border border-[#c9933a]/20 mb-6">
                            <TouchableOpacity
                                onPress={() => toggleMode('normal')}
                                className={`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-2 ${mode === 'normal' ? 'bg-[#c9933a]' : ''}`}
                            >
                                <Layers size={14} color={mode === 'normal' ? '#0f2418' : '#c8b98a'} />
                                <Text className={`font-bold ${mode === 'normal' ? 'text-[#0f2418]' : 'text-[#c8b98a]'}`}>Normal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => toggleMode('extended')}
                                className={`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-2 ${mode === 'extended' ? 'bg-[#c9933a]' : ''}`}
                            >
                                <Settings size={14} color={mode === 'extended' ? '#0f2418' : '#c8b98a'} />
                                <Text className={`font-bold ${mode === 'extended' ? 'text-[#0f2418]' : 'text-[#c8b98a]'}`}>Extended</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Room Name */}
                        <View className="mb-4">
                            <Text className="text-[#c8b98a] text-xs font-bold uppercase tracking-widest mb-2">Room Name</Text>
                            <TextInput
                                placeholder="e.g. Saturday Night Cards"
                                placeholderTextColor="rgba(245, 237, 216, 0.3)"
                                className="bg-black/30 border border-[#c9933a]/30 text-[#fffbf0] p-3 rounded-lg font-bold"
                                value={form.name}
                                onChangeText={t => setForm({...form, name: t})}
                            />
                        </View>

                        {/* Points & Players */}
                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-[#c8b98a] text-xs font-bold uppercase tracking-widest mb-2">Points</Text>
                                <Stepper value={form.points} min={100} max={2000} step={50} onChange={v => setForm({...form, points: v})} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[#c8b98a] text-xs font-bold uppercase tracking-widest mb-2">Players</Text>
                                <Stepper value={form.players} min={2} max={10} onChange={v => setForm({...form, players: v})} />
                            </View>
                        </View>

                        {/* EXTENDED SECTION (Collapsible) */}
                        {mode === 'extended' && (
                            <View className="bg-black/20 p-3 rounded-xl border border-dashed border-[#c9933a]/30 mb-4">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <Settings size={14} color={THEME.red} />
                                    <Text className="text-[#e74c3c] font-bold text-xs uppercase tracking-widest">Advanced Rules</Text>
                                </View>

                                {/* Decks */}
                                <View className="mb-4">
                                    <Text className="text-[#c8b98a] text-xs mb-2">Card Decks</Text>
                                    <Stepper value={form.decks} min={1} max={4} onChange={v => setForm({...form, decks: v})} suffix=" Deck(s)" />
                                </View>

                                {/* Timer Toggle */}
                                <View className="flex-row justify-between items-center py-2 border-t border-[#c9933a]/10">
                                    <Text className="text-[#ivory] font-bold">Turn Timer</Text>
                                    <Switch
                                        value={form.timer}
                                        onValueChange={v => { Haptics.selectionAsync(); setForm({...form, timer: v})}}
                                        trackColor={{ false: '#333', true: THEME.teal }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Private Toggle */}
                        <View className="flex-row justify-between items-center bg-black/30 p-3 rounded-xl border border-[#c9933a]/20 mb-6">
                            <View className="flex-row items-center gap-2">
                                {form.isPrivate ? <Lock size={18} color="#e74c3c" /> : <Lock size={18} color="#c8b98a" />}
                                <View>
                                    <Text className="text-[#f5edd8] font-bold">Private Room</Text>
                                    <Text className="text-[#c8b98a] text-[10px]">Requires Password</Text>
                                </View>
                            </View>
                            <Switch
                                value={form.isPrivate}
                                onValueChange={v => { Haptics.selectionAsync(); setForm({...form, isPrivate: v})}}
                                trackColor={{ false: '#333', true: '#c9933a' }}
                                thumbColor="#fff"
                            />
                        </View>

                        {/* CREATE BUTTON */}
                        <DopamineButton
                            className="w-full py-4 rounded-xl overflow-hidden shadow-lg shadow-[#c9933a]/40"
                        >
                            <LinearGradient
                                colors={[THEME.gold, '#e8b96a']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                className="absolute inset-0"
                            />
                            <Text className="text-[#0f2418] text-center font-bold text-lg tracking-widest uppercase">
                                Create Room
                            </Text>
                        </DopamineButton>
                    </ScrollView>
                </View>

                {/* ════ RIGHT COLUMN: ROOM LIST (Flex 0.6) ════ */}
                <View className="flex-[0.6] bg-[#1a3d2b]/90 border border-[#c9933a]/40 rounded-2xl overflow-hidden shadow-2xl flex-col">

                    {/* Header */}
                    <View className="p-4 border-b border-[#c9933a]/30 flex-row items-center justify-between bg-black/20">
                        <View className="flex-row items-center gap-3">
                            <View className="w-8 h-8 rounded bg-[#1abc9c]/20 items-center justify-center">
                                <Users size={18} color={THEME.teal} />
                            </View>
                            <View>
                                <Text className="text-[#e8b96a] font-serif font-bold text-xl">Lobby</Text>
                                <View className="flex-row items-center gap-1">
                                    <View className="w-2 h-2 rounded-full bg-[#1abc9c]" />
                                    <Text className="text-[#1abc9c] text-[10px] font-bold uppercase tracking-widest">Live</Text>
                                </View>
                            </View>
                        </View>

                        {/* Filter Chips */}
                        <View className="flex-row gap-2">
                            {['all', 'waiting'].map(f => (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-full border ${filter === f ? 'bg-[#c9933a]/20 border-[#c9933a]' : 'border-transparent'}`}
                                >
                                    <Text className={`text-xs font-bold uppercase ${filter === f ? 'text-[#c9933a]' : 'text-[#c8b98a]'}`}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View className="px-4 py-3 bg-black/10">
                        <View className="flex-row items-center bg-black/30 border border-[#c9933a]/20 rounded-lg px-3 h-10">
                            <Search size={16} color={THEME.ivoryDim} />
                            <TextInput
                                placeholder="Search rooms..."
                                placeholderTextColor="rgba(200, 185, 138, 0.5)"
                                className="flex-1 ml-2 text-[#f5edd8] font-bold h-full"
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                    </View>

                    {/* List */}
                    <FlatList
                        data={ROOMS}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        renderItem={({ item, index }) => {
                            const isFull = item.players >= item.max;
                            const isPlaying = item.status === 'playing';

                            return (
                                <DopamineButton
                                    className={`bg-black/40 border border-[#c9933a]/30 rounded-lg p-4 flex-row items-center justify-between ${isFull ? 'opacity-50' : ''}`}
                                >
                                    {/* Room Info */}
                                    <View>
                                        <View className="flex-row items-center gap-2 mb-1">
                                            <Text className="text-[#f5edd8] font-serif font-bold text-lg">{item.name}</Text>
                                            {item.private && <Lock size={12} color="#c9933a" />}
                                        </View>
                                        <View className="flex-row items-center gap-3">
                                            <Text className="text-[#c8b98a] text-xs">👥 {item.players}/{item.max}</Text>
                                            <Text className="text-[#c8b98a] text-xs">🏆 {item.pts}pts</Text>
                                        </View>
                                    </View>

                                    {/* Right Side Actions */}
                                    <View className="items-end gap-2">
                                        <View className={`px-2 py-0.5 rounded border ${isPlaying ? 'bg-red-900/30 border-red-500' : 'bg-teal-900/30 border-teal-500'}`}>
                                            <Text className={`text-[10px] font-bold uppercase tracking-widest ${isPlaying ? 'text-red-400' : 'text-teal-400'}`}>
                                                {isPlaying ? 'Playing' : 'Waiting'}
                                            </Text>
                                        </View>

                                        {!isFull && !isPlaying ? (
                                            <View className="flex-row items-center gap-1">
                                                <Text className="text-[#1abc9c] font-bold text-xs">JOIN</Text>
                                                <Play size={10} color={THEME.teal} fill={THEME.teal} />
                                            </View>
                                        ) : (
                                            <View className="flex-row items-center gap-1">
                                                <Text className="text-[#c9933a] font-bold text-xs">WATCH</Text>
                                                <Eye size={12} color={THEME.gold} />
                                            </View>
                                        )}
                                    </View>
                                </DopamineButton>
                            );
                        }}
                    />

                </View>

            </View>
        </View>
    );
}