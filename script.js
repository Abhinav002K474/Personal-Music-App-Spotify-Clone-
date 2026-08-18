document.addEventListener('DOMContentLoaded', async () => {
    // ── DISCORD ACTIVITY INITIALIZATION ────────────────────────────────
    const CLIENT_ID = '1304328735904497795';
    let discordSdk = null;

    if (window.discordSdk) {
        try {
            discordSdk = new window.discordSdk.DiscordSDK(CLIENT_ID);
            await discordSdk.ready();
            console.log("Discord SDK is ready");
        } catch (err) {
            console.error("Discord SDK initialization failed:", err);
        }
    }
    // ────────────────────────────────────────────────────────────────────

    const playBtn = document.querySelector('.play-btn');
    const progressBar = document.querySelector('.progress-fill');
    const homeView = document.getElementById('home-view');
    const playlistView = document.getElementById('playlist-view');
    const libraryView = document.getElementById('library-view');
    const tracklistBody = document.getElementById('tracklist-body');
    const libraryTracklist = document.getElementById('library-tracklist');
    const audio = document.getElementById('main-audio');
    
    // Navigation items
    const navHome = document.getElementById('nav-home');
    const navSearch = document.getElementById('nav-search');
    const navLibrary = document.getElementById('nav-library');
    
    let isPlaying = false;
    let currentTrackIndex = -1;
    let currentQueue = [];

    const playSVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    const pauseSVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';

    // View Management
    const showView = (viewId) => {
        const views = ['home-view', 'playlist-view', 'library-view', 'search-view'];
        views.forEach(id => {
            const v = document.getElementById(id);
            if(v) v.style.display = (id === viewId) ? 'block' : 'none';
        });
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        if (viewId === 'home-view') navHome.classList.add('active');
        if (viewId === 'library-view') navLibrary.classList.add('active');
        if (viewId === 'search-view') navSearch.classList.add('active');
    };

    navHome.addEventListener('click', (e) => { e.preventDefault(); showView('home-view'); });
    navSearch.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showView('search-view'); 
        const searchInput = document.getElementById('global-search');
        if(searchInput) searchInput.focus();
    });
    navLibrary.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showView('library-view'); 
        const libSearchInput = document.getElementById('library-search');
        if(libSearchInput) libSearchInput.value = ""; // Clear filter on nav click
        renderLibrary(); 
    });

    const navGoldenDays = document.getElementById('nav-golden-days');
    if(navGoldenDays) {
        navGoldenDays.addEventListener('click', (e) => {
            e.preventDefault();
            showView('playlist-view');
            renderPlaylist();
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            navGoldenDays.classList.add('active');
        });
    }

    // Persistent Storage
    const saveLibrary = () => {
        localStorage.setItem('stressTuneLibrary', JSON.stringify(libraryTracks));
    };

    // Load from storage or use defaults
    const defaultTracks = [
        { 
            "title": "Someone You Loved", 
            "artist": "Lewis Capaldi", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779888678/Lewis_Capaldi_-_Someone_You_Loved_Lyrics_bcrgau.mp3", 
            "cover": "midnight_rain.png", 
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888291/YTDown_YouTube_Media_N-uPKh23-40_002_720p_nhibvs.mp4" 
        },
        { "title": "Line Without a Hook", "artist": "Ricky Montgomery", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093595/Ricky_Montgomery_-_Line_Without_a_Hook_Lyrics_cyfzbv.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778180350/videoplayback_sopenc.mp4" },
        { "title": "Another Love Official Video", "artist": "Tom Odell", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093621/Tom_Odell_-_Another_Love_Official_Video_wdkyta.mp3", "cover": "zen_garden.png" },
        { "title": "Into Your Arms feat. Ava Max Official Music Video", "artist": "Witt Lowry", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093619/Witt_Lowry_-_Into_Your_Arms_feat._Ava_Max_Official_Music_Video_ploleq.mp3", "cover": "midnight_rain.png" },
        { "title": "Rise Up Lyrics", "artist": "TheFatRat", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093617/TheFatRat_-_Rise_Up_Lyrics_kgyrr8.mp3", "cover": "zen_garden.png" },
        { 
            "title": "YOASOBI アイドル Official Music Video", 
            "artist": "YOASOBI", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093617/YOASOBI%E3%82%A2%E3%82%A4%E3%83%89%E3%83%AB_Official_Music_Video_f4wtav.mp3", 
            "cover": "https://media3.giphy.com/media/gu7LwwKIqXZ5jUo92J/giphy.gif",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778387693/YTDown_YouTube_Media_ZRtdQ81jPUQ_002_720p_mjwhn5.mp4"
        },
        { "title": "Angel With A Shotgun Lyrics Video", "artist": "The Cab", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093615/The_Cab-Angel_With_A_Shotgun_Lyrics_Video_fpsuab.mp3", "cover": "neon_beats.png" },
        { "title": "The Resistance Official Lyric Video", "artist": "Skillet", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093611/Skillet_-_The_Resistance_Official_Lyric_Video_tabkgg.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546652/YTDown_YouTube_Beyblade-Burst-AMV-Resistance_Media_fj8p1pJmMLo_001_720p_b5z4xe.mp4" },
        { "title": "Awake and Alive Official Audio", "artist": "Skillet", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Skillet_-_Awake_and_Alive_Official_Audio_zcymmq.mp3", "cover": "zen_garden.png" },
        { "title": "Perfect Official Video HD", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Simple_Plan_-_Perfect_Official_Video_HD_pr8iqb.mp3", "cover": "neon_beats.png" },
        { "title": "Welcome To My Life Official Video", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Simple_Plan_-_Welcome_To_My_Life_Official_Video_ragvye.mp3", "cover": "zen_garden.png" },
        { "title": "Not Gonna Die OFFICIAL MUSIC VIDEO", "artist": "Skillet", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Skillet_-_Not_Gonna_Die_OFFICIAL_MUSIC_VIDEO_n1fprj.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779544948/YTDown_YouTube_Beyblade-Kai-not-gonna-die-Amv_Media_8VwC-2bEF1U_002_720p_ls6fya.mp4" },
        { "title": "Eenie Meenie Lyrics", "artist": "Sean Kingston Justin Bieber", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093604/Sean_Kingston_Justin_Bieber_-_Eenie_Meenie_Lyrics_ez7b6c.mp3", "cover": "zen_garden.png" },
        { "title": "Last One Standing HQ", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093603/Simple_Plan_-_Last_One_Standing_HQ_lvtrgc.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778329581/YTDown_YouTube_SAO-AMV-Kirito-Tribute-Last-One-Standing_Media_rJvH7oOSRBQ_001_720p_ezytk3.mp4" },
        { "title": "This Song Saved My Life", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093603/Simple_Plan_-_This_Song_Saved_My_Life_su9dpe.mp3", "cover": "midnight_rain.png" },
        { "title": "Love Me Not Lyrics", "artist": "Ravyn Lenae", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093602/Ravyn_Lenae_-_Love_Me_Not_Lyrics_hywg7p.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779544700/YTDown_YouTube_Love-Me-Not-A-Silent-Voice-AMV_Media_QFEiHhoaD1U_002_720p_hgg34f.mp4" },
        { "title": "Rise", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093601/Rise_vd0c0o.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779889021/YTDown_YouTube_Tensei-Shitara-Slime-Datta-Ken-AMV-Rise-_Media_ruCbOOnrXb8_002_720p_pwytjn.mp4" },
        { "title": "Dandelions Lyrics", "artist": "Ruth B.", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093597/Ruth_B._-_Dandelions_Lyrics_ro6pjb.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779095683/Dandelions_-_AMV_-_Anime_MV_xvlg0y.mp4" },
        { "title": "APT. Official Music Video", "artist": "ROSE Bruno Mars", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093597/ROSE_Bruno_Mars_-_APT._Official_Music_Video_zdi0j1.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779709552/vidssave.com_ROS%C3%89_Bruno_Mars_-_APT._Official_Music_Video_720p_zbgy5p.mp4" },
        { "title": "KINGS QUEENS", "artist": "Qin shi huang vs Hades", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093594/Qin_shi_huang_vs_Hades_KINGS_QUEENS_mpcpoh.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778215631/Classroom_of_the_Elite_III_AMV_Kings_Queens_-_Luc%D1%87_%D3%87%D1%94%CE%B1rt%E1%83%A6_720p_h264_bqgpfe.mp4" },
        { "title": "Grateful Copyright Free No.54", "artist": "NEFFEX", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093591/NEFFEX_-_Grateful_Copyright_Free_No.54_n1znzm.mp3", "cover": "neon_beats.png" },
        { "title": "House of Memories", "artist": "Panic At The Disco", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093589/Panic_At_The_Disco_-_House_of_Memories_jhan2s.mp3", "cover": "midnight_rain.png" },
        { "title": "Unforgettable freestyle lyrics", "artist": "PnB Rock", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093589/PnB_Rock_-_Unforgettable_freestyle_lyrics_l5qwwj.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779095663/Pnb_Rock_-_Unforgettable_Freestyle_AMV_EDIT_Free_Preset_Edit_By_Galaxy_Edit_z_pnbrocktypebeat_dkv6wo.mp4" },
        { "title": "Passenger Let Her Go Official Video", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093588/Passenger_Let_Her_Go_Official_Video_mcvfge.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888108/vidssave.com_Let_Her_Go_-_Hyouka_720P_cg4jy4.mp4" },
        { "title": "Courtesy Call", "artist": "Nightcore", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093587/Nightcore_-_Courtesy_Call_yrf5kr.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778232193/vidssave.com_Kalos_League_Showdown_AMV_Courtesy_Call_-_Pokemon_XYZ_1080P_gzmf5b.mp4" },
        { "title": "Animals Lyrics", "artist": "Maroon 5", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093586/Maroon_5_-_Animals_Lyrics_xewnpl.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785575922/vidssave.com_Animals_-_AMV_Anime_Mix_720p_bpiafr.mp4" },
        { "title": "Rumors Copyright Free No.12", "artist": "NEFFEX", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093584/NEFFEX_-_Rumors_Copyright_Free_No.12_puohps.mp3", "cover": "midnight_rain.png" },
        { "title": "Night Changes", "artist": "One Direction", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093582/One_Direction_-_Night_Changes_tbdrhz.mp3", "cover": "zen_garden.png" },
        { "title": "Darkside", "artist": "NEONI", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778264297/NEONI_-_Darkside_Lyrics_soia8k.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778264000/vidssave.com_The_Eminence_in_Shadow_AMV_-_Darkside_1080P_uo8vq9.mp4" },
        { "title": "Love Story Lyrics", "artist": "Indila", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093577/Indila_-_Love_Story_Lyrics_frfupr.mp3", "cover": "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778164404/The_legend_of_the_maiden_espwa3.webp", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217932/Love_story_...Follow_sliceofanime_0_for_more_..._pokemon_theghostofmaidenspeak_sadanimeedit_mds8xw.mp4" },
        { "title": "Young and Beautiful 1", "artist": "Lana Del Rey", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093577/Lana_Del_Rey_-_Young_and_Beautiful_1_mwnvnu.mp3", "cover": "midnight_rain.png" },
        { "title": "League of Legends", "artist": "Legends Never Die ft. Against The Current", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093576/Legends_Never_Die_ft._Against_The_Current_OFFICIAL_AUDIO_Worlds_2017_-_League_of_Legends_lc63y8.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778345464/vidssave.com_Legends_Never_Die___Ezio_Auditore___Assassin_s_Creed___GMV_1080p_bjgz4d.mp4" },
        { "title": "Stereo Hearts Lyrics Heart Stereo", "artist": "Gym Class Heroes", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093574/Gym_Class_Heroes_-_Stereo_Hearts_Lyrics_Heart_Stereo_lrv1cb.mp3", "cover": "neon_beats.png" },
        { "title": "On The Floor ft. Pitbull", "artist": "Jennifer Lopez", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093574/Jennifer_Lopez_-_On_The_Floor_ft._Pitbull_xw6kz0.mp3", "cover": "zen_garden.png" },
        { "title": "Summertime Sadness Official Music Video", "artist": "Lana Del Rey", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093571/Lana_Del_Rey_-_Summertime_Sadness_Official_Music_Video_ju5dqe.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888076/vidssave.com_AMV_Anime_mix_-_Summertime_Sadness_HD_720P_jrfi7a.mp4" },
        { "title": "Die With A Smile", "artist": "Lady Gaga Bruno Mars", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093571/Lady_Gaga_Bruno_Mars_-_Die_With_A_Smile_hskjah.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217207/Die_With_A_Smile_Eren_X_Mikasa_AMV_-_ToastLmao_1080p_h264_mgn6x0.mp4" },
        { "title": "Somewhere Only We Know Lyrics", "artist": "Keane", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093571/Keane_-_Somewhere_Only_We_Know_Lyrics_ivjhnl.mp3", "cover": "neon_beats.png" },
        { "title": "Heat Waves Full Version", "artist": "Glass animals x HighCloud Cover", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093566/Heat_Waves_-_Glass_animals_x_HighCloud_Cover_Full_Version_v19c1e.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779198119/Heat_Waves_-_AMV_-_Anime_MV_h8pxs0.mp4" },
        { "title": "The Phoenix Part 2 of 11", "artist": "Fall Out Boy", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093565/Fall_Out_Boy_-_The_Phoenix_Official_Video_-_Part_2_of_11_xsllmm.mp3", "cover": "midnight_rain.png" },
        { "title": "Mockingbird Lyrics", "artist": "Eminem", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093560/Eminem_-_Mockingbird_Lyrics_bcn8fg.mp3", "cover": "zen_garden.png" },
        { "title": "Fairytale", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093560/Fairytale_lxzstg.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778438594/vidssave.com_Fairytale_-_AMV_-_Anime_MIX_720P_bvwxet.mp4" },
        { "title": "Perfect Lyrics", "artist": "Ed Sheeran", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093558/Ed_Sheeran_-_Perfect_Lyrics_yhbbdg.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482939/vidssave.com_Perfect_-_AMV_-_Anime_MV_720p60_wxckgb.mp4" },
        { "title": "Love Me Like You Do Lyrics", "artist": "Ellie Goulding", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093558/Ellie_Goulding_-_Love_Me_Like_You_Do_Lyrics_x699mn.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482299/vidssave.com_amu_ikuto___love_me_like_you_do_720P_lzsffp.mp4" },
        { "title": "Gangsta s Paradise feat. L.V. Official Music Video", "artist": "Coolio", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093556/Coolio_-_Gangsta_s_Paradise_feat._L.V._Official_Music_Video_vgpvl1.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778263902/AMV_-_Tokyo_revengers_-_gangster_paradise_Toman_vs_Valhalla_xkehvs.mp4" },
        { "title": "Royalty ft. Neoni Official Lyric Video", "artist": "Egzod Maestro Chives", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093556/Egzod_Maestro_Chives_-_Royalty_ft._Neoni_Official_Lyric_Video_zzklxh.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785575408/vidssave.com_Royalty_-_AMV_Anime_Mix_720P_qppstz.mp4" },
        { "title": "discord x my ordinary life mashup", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093554/discord_x_my_ordinary_life_slowed_reverb_full_mashup_ffoshx.mp3", "cover": "zen_garden.png" },
        { "title": "Runaway Lyrics", "artist": "AURORA", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093550/AURORA_-_Runaway_Lyrics_ycromm.mp3", "cover": "midnight_rain.png" },
        { "title": "A Thousand Years", "artist": "Christina Perri", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093549/Christina_Perri_-_A_Thousand_Years_pbdqk7.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217932/Love_story_...Follow_sliceofanime_0_for_more_..._pokemon_theghostofmaidenspeak_sadanimeedit_mds8xw.mp4" },
        { "title": "Hymn For The Weekend Lyrics", "artist": "Coldplay", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093549/Coldplay_-_Hymn_For_The_Weekend_Lyrics_bt19jp.mp3", "cover": "neon_beats.png" },
        { "title": "LET THE WORLD BURN Official Lyric Video", "artist": "Chris Grey", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093547/Chris_Grey_-_LET_THE_WORLD_BURN_Official_Lyric_Video_k9hoxo.mp3", "cover": "zen_garden.png" },
        { "title": "Broken Angel Lyrics Ft.Helena Im so lonely", "artist": "Arash", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093545/Arash_-_Broken_Angel_Lyrics_Ft.Helena_Im_so_lonely_broken_angel_xvxhwn.mp3", "cover": "midnight_rain.png" },
        { "title": "Let Me Down Slowly", "artist": "Alec Benjamin", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093543/Alec_Benjamin_-_Let_Me_Down_Slowly_kcvram.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1787043078/vidssave.com_Let_Me_Down_Slowly_AMV_-_Anime_Mix_720P_1_bb6wy9.mp4" },
        { "title": "The Nights Lyrics my father told me", "artist": "Avicii", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093542/Avicii_-_The_Nights_Lyrics_my_father_told_me_e5svqx.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778683695/vidssave.com_One_piece-MV_Avicii-The_Nights_720P_ye2hqn.mp4" },
        { "title": "Moral Of The Story Lyrics 1", "artist": "Ashe", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093541/Ashe_-_Moral_Of_The_Story_Lyrics_1_a8zmg3.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785576399/Moral_of_the_Story_-_AMV_-_Anime_MV_t6jyln.mp4" },
        { "title": "I Wanna Be Yours Instrumental Best part looped", "artist": "Arctic Monkeys", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093541/Arctic_Monkeys_-_I_Wanna_Be_Yours_Instrumental_Best_part_looped_z7ljqh.mp3", "cover": "midnight_rain.png" },
        { "title": "End Of Me Pseudo Video", "artist": "Ashes Remain", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093539/Ashes_Remain_-_End_Of_Me_Pseudo_Video_lktk4s.mp3", "cover": "zen_garden.png" },
        { "title": "2 Phut Hon phao Lyrics kaiz Remix", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093539/2_Phut_Hon_-_phao_Lyrics_kaiz_Remix_phut_Hon_remix_lyrics_TikTok_Song_Sub._English_-_Lyrics_d1a3ex.mp3", "cover": "neon_beats.png" },
        { "title": "Moral Of The Story Lyrics", "artist": "Ashe", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093536/Ashe_-_Moral_Of_The_Story_Lyrics_pjdv1o.mp3", "cover": "zen_garden.png" },
        { "title": "I Wanna Be Yours Lyrics", "artist": "Arctic Monkeys", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093533/Arctic_Monkeys_-_I_Wanna_Be_Yours_Lyrics_tool3t.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779094469/I_WANNA_BE_YOURS_AMV_lhzb07.mp4" },
        { "title": "Alone Pt. II Lyrics", "artist": "Alan Walker Ava Max", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093533/Alan_Walker_Ava_Max_-_Alone_Pt._II_Lyrics_nr1wnq.mp3", "cover": "zen_garden.png" },
        { "title": "On My Way", "artist": "Alan Walker Sabrina Carpenter Farruko", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093529/Alan_Walker_Sabrina_Carpenter_Farruko_-_On_My_Way_t6nwnc.mp3", "cover": "neon_beats.png" },
        { "title": "Faded", "artist": "Alan Walker", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093529/Alan_Walker_-_Faded_rqjfr9.mp3", "cover": "zen_garden.png" },

        { "title": "Carry On Detective Pikachu Official Video", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778159311/Carry_On_from_the_Original_Motion_Picture_POK%C3%89MON_Detective_Pikachu_Official_Video_izizw7.mp3", "cover": "midnight_rain.png" },
        { "title": "Another Love Lyrics", "artist": "Tom Odell", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778159299/Tom_Odell_-_Another_Love_Lyrics_a6ewel.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778218884/Sanji_Pudding_Their_Story_-_Another_Love_AMV_-_Riddler_Thriller_1080p_h264_twghwl.mp4" },
        { "title": "Atlantis Lyrics", "artist": "Seafret", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778159299/Seafret_-_Atlantis_Lyrics_vg7dhz.mp3", "cover": "neon_beats.png" },
        { "title": "Sad Song", "artist": "We The Kings ft. Elena Coats", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778179435/We_The_Kings_-_Sad_Song_Lyric_Video_ft._Elena_Coats_y2vbxu.mp3", "cover": "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778179316/download_b4rtyo.jpg", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888030/vidssave.com_AMV_-_Sad_Song_%E1%B4%B4%E1%B4%B0_720P_v2xdqt.mp4" },
        { "title": "Hikaru Nara", "artist": "Goose house", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778215441/Hikaru_Nara_-_Goose_House_Romaji_Espa%C3%B1ol_English_Color_Coded_jehopo.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778216563/Your_Lie_in_April_OP_Opening_Theme_-_Hikaru_Nara_-_AniClipsCollection_720p_h264_okikjc.mp4" },
        { "title": "Mortals", "artist": "Warriyo ft. Laura Brehm", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778231345/Warriyo_-_Mortals_ft._Laura_Brehm_o8vhwd.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778231291/vidssave.com_Hayato_Awakening___Garena_Free_Fire_720P_ysgs64.mp4" },
        { "title": "Alone x Fadded", "artist": "Alan Walker Mashup", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778231726/Alan_Walker_Mashup_Lyrics_Alone_X_Faded_X_Alone_Pt._2_X_On_My_Way..._alanwalker_fadedxaloneptii_afscdd.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778231741/vidssave.com_ANIME_EYES_EDIT___THIS_IS_4K_ANIME_EYES___PEPEKACHU_1080P_izqkmk.mp4" },
        { "title": "Shatter Me", "artist": "Lindsey Stirling ft. Lzzy Hale", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778346095/Lindsey_Stirling_-_Shatter_Me_ft._Lzzy_Hale_Lyrics_wztopr.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778345854/YTDown_YouTube_Naofumi-_-Raphtalia-Shatter-Me-AMV_Media_ffiphpTEZS8_001_720p_qlou9a.mp4" },
        { "title": "Royalty X Madara", "artist": "Madara Uchiha AMV", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778350313/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_48KBPS_ah4y1q.webm", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778350407/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_2160P_bwgy18.mp4" },
        { "title": "My Demons", "artist": "Starset", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778431256/Starset-My_Demons_Lyrics_Video_u1952b.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778431420/beyblade-amv-my-demons-720-ytshorts.savetube.me_e2w4e9.mp4" },
        { "title": "Stay with me", "artist": "Heavenly Jumpstyle", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778434792/HEAVENLY_JUMPSTYLE_Lyrics_woamjr.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778434595/YTDown_Shorts_Resting-My-Eyes-Leon-Kennedy-Edit-HEAVEN_Media_9uZk7Ugr-Zc_002_720p_nf450q.mp4" },
        { "title": "Dynasty", "artist": "MIIA", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483126/MIIA_-_Dynasty_Lyrics_db8g63.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482821/YTDown_YouTube_Dynasty-AMV-Anime-Mix_Media_pmN_l7FuyIg_002_720p_vbrqdr.mp4" },
        { "title": "Love is Gone", "artist": "SLANDER ft. Dylan Matthew", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483122/SLANDER_-_Love_Is_Gone_ft._Dylan_Matthew_Acoustic_j4pugd.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778482360/vidssave.com_Love_Is_Gone_AMV_MIX_1080P_ivxwrs.mp4" },
        { "title": "Infinity", "artist": "Jaymes Young", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483293/Jaymes_Young_-_Infinity_h8k3qg.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778482714/vidssave.com_AMV_-_Infinity_%E1%B4%B4%E1%B4%B0_1080P_ka9jub.mp4" },
        { "title": "Warriors", "artist": "Imagine Dragons", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779546594/Imagine_Dragons_-_Warriors_Lyrics_kq7uoe.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546708/YTDown_YouTube_Beyblade-Burst-AMV-Shu-Kurenai-Warriors_Media_oZGFW0kKQZg_002_720p_tyzvjn.mp4" },
        { "title": "Monsters", "artist": "Skillet", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779547135/Skillet_-_Monster_Lyrics_so9wtg.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546613/YTDown_YouTube_Beyblade-amv-Kai-vs-Tyson-I-feel-like-a-_Media_H_2gXjAGUJg_001_480p_jxbtvc.mp4" },
        {
            "title": "That's so True",
            "artist": "Gracie Abrams",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835555/Gracie_Abrams_-_Thats_So_True_Lyrics_vdk0ni.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780835141/vidssave.com_That_s_so_true_-_Anime_mix_AMV_EDIT_720P_glojlt.mp4"
        },
        {
            "title": "Sweater Weather",
            "artist": "The Neighbourhood",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835203/The_Neighbourhood_-_Sweater_Weather_Lyrics_rvb1eg.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780934192/AMV_-_Sweater_Weather_James_Harris_-_Anime_Mix_-_Yuki._640p_dwum1a.mp4"
        },
        {
            "title": "Play Date",
            "artist": "Melanie Martinez",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835226/Melanie_Martinez_-_Play_Date_Lyrics_wnscjy.mp3",
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780835943/vidssave.com_Play_Date_AMV_-_Anime_MV_720P_nmbdzh.mp4"
        },
        {
            "title": "Bloody Mary",
            "artist": "Lady Gaga",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835197/Lady_Gaga_-_Bloody_Mary_ofcdeb.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780835103/vidssave.com_Wednesday_Dance_-_Lady_Gaga_-_Bloody_Mary_720p_kigppu.mp4"
        },
        {
            "title": "Attack on Titan",
            "artist": "Ai Higuchi",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781786111/%E3%83%92%E3%82%B0%E3%83%81%E3%82%A2%E3%82%A4_%E6%82%AA%E9%AD%94%E3%81%AE%E5%AD%90_%E3%82%A2%E3%83%8B%E3%83%A1%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%ABVer._Ai_Higuchi_Akuma_no_Ko_Anime_Special_Ver._1_arjzam.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781786069/vidssave.com_%E3%83%92%E3%82%B0%E3%83%81%E3%82%A2%E3%82%A4___%E6%82%AA%E9%AD%94%E3%81%AE%E5%AD%90_%E3%82%A2%E3%83%8B%E3%83%A1%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%ABVer.___Ai_Higuchi_Akuma_no_Ko_Anime_Special_Ver._720p_1_bmjsc0.mp4"
        },
        {
            "title": "Bink's Sake",
            "artist": "One Piece",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781786090/One_Piece_OST_-_Binks_no_Sake_Strawhat_Version_Lyrics_xsovfc.mp3",
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781786171/vidssave.com_one_piece_binks_no_sake_sub_espanol_romajiamv_720P_qy8zep.mp4"
        },
        {
            "title": "Waka Waka",
            "artist": "Shakira",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781719136/Shakira_-_Waka_Waka_This_Time_for_Africa_The_Official_2010_FIFA_World_Cup_Song_i208vx.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781719013/vidssave.com_Shakira_-_Waka_Waka_This_Time_for_Africa_The_Official_2010_FIFA_World_Cup_Song_720P_huw1tm.mp4"
        },
        {
            "title": "Bye Bye",
            "artist": "NSYNC",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781790062/DEADPOOL_WOLVERINE_2024_Bye_Bye_Bye_Opening_Scene_-_Movie_CLIP_HD_1Klb46_FkBI_s7ur31.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781790106/vidssave.com_DEADPOOL_WOLVERINE_2024_Bye_Bye_Bye_Opening_Scene_-_Movie_CLIP_HD_720P_m5zw9c.mp4"
        },
        {
            "title": "Warrior Inside",
            "artist": "Beyblade",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1783859747/Beyblade_AMV_-_Warrior_Inside_a6r7rs.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1783859784/YTDown.com_YouTube_Beyblade-AMV-Warrior-Inside_Media_nn7lRc0_iAc_002_720p_zwnuwy.mp4"
        },
        {
            "title": "Centuries",
            "artist": "Fall Out Boy",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1783861599/Madara_Uchiha_AMV_-_Centuries_pgjail.mp3",
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1783861621/YTDown.com_YouTube_Madara-Uchiha-AMV-Centuries_Media_esJOOQG42r0_001_720p_ql2ccn.mp4"
        },
        {
            "title": "Believer",
            "artist": "Imagine Dragons",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1783860831/Charizard_Greninja_Infernape_Lycanroc_AMV_-_Believer_jw8wfm.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1783860953/YTDown.com_YouTube_Charizard-Greninja-Infernape-Lycanroc-AM_Media_THflA-4Itaw_002_720p_r5vgl9.mp4"
        },
        {
            "title": "Shameless",
            "artist": "Camila Cabello",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1785574107/Camila_Cabello_-_Shameless_utlquw.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785574164/vidssave.com_Shameless_-_Demon_Slayer_AMV_720P_i0k0qt.mp4"
        },
        {
            "title": "Darkside 2",
            "artist": "NEONI",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093581/NEONI_-_Darkside_Lyrics_mbp67u.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785575094/vidssave.com_Darkside_AMV_Anime_Mix_720P_dscnqw.mp4"
        },
        {
            "title": "Bumble Bee",
            "artist": "Nightcore",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1785588159/Nightcore_Sweet_Little_Bumblebee_lyric_video_skehr5.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785588186/vidssave.com_Nightcore___Sweet_Little_Bumblebee_lyric_video_720P_kgbncy.mp4"
        },
        {
            "title": "Caramelldansen HD Version (Swedish Original)",
            "artist": "Caramella Girls",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1787040726/Caramella_Girls_-_Caramelldansen_HD_Version_Swedish_Original_guyspl.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1787040709/vidssave.com_Caramella_Girls_-_Caramelldansen_HD_Version_Swedish_Original_720p_hq9h82.mp4"
        },
        {
            "title": "Pokemon Season 1 Opening",
            "artist": "Pokémon",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781268669/Pok%C3%A9mon_Season_1_Opening_in_Tamil_jngk1k.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203417/vidssave.com_Pok%C3%A9mon_Season_1_Opening_in_Tamil_360P_lz7ly2.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Spectacular Spider Man Opening",
            "artist": "The Spectacular Spider-Man",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781202505/Spectacular_Spider-Man_Music_Video_rewrmi.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203293/vidssave.com_Spectacular_Spider-Man_Music_Video_720P_oumz3b.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Kickbatoski \"Thadaladi\"",
            "artist": "Kick Buttowski",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781202485/Kick_Buttowski_Intro_mi5luu.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203346/vidssave.com_Kick_Buttowski_Intro_720P_hflsfk.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Doremon 1979 Opening",
            "artist": "Doraemon",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781269856/Doraemon_1979_1st_Opening_Theme_in_Tamil_With_Lyrics_dsopxr.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781269825/Doraemon_1979_Opening_Theme_Song_HD_enqlpo.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Doremon New Song",
            "artist": "Doraemon",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781202955/Doraemon_New_Intro_Song_in_Tamil_uysqjm.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203370/vidssave.com_Doraemon_New_Intro_Song_in_Tamil_720P_zisfkw.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Yokai Watch",
            "artist": "Yo-kai Watch",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781270348/%E5%A6%96%E6%80%AA%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81%E5%85%AC%E5%BC%8F%E3%82%AA%E3%83%BC%E3%83%97%E3%83%8B%E3%83%B3%E3%82%B0%E7%AC%AC1%E5%BC%BE_%E3%82%B2%E3%83%A9%E3%82%B2%E3%83%A9%E3%83%9D%E3%83%BC%E3%81%AE%E3%81%86%E3%81%9F%E5%A6%96Tube_dhoq9z.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203391/vidssave.com_%E5%A6%96%E6%80%AA%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81%E5%85%AC%E5%BC%8F_%E3%82%AA%E3%83%BC%E3%83%97%E3%83%8B%E3%83%B3%E3%82%B0%E7%AC%AC1%E5%BC%BE_%E3%82%B2%E3%83%A9%E3%82%B2%E3%83%A9%E3%83%9D%E3%83%BC%E3%81%AE%E3%81%86%E3%81%9F_%E5%A6%96Tube_720P_firsfn.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Ben 10",
            "artist": "Ben 10",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781786867/Ben_10_title_song_Tamil_jw1b4s.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781785163/vidssave.com_Ben_10_title_song_Tamil_360P_lopht9.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Phineas and Ferb Opening",
            "artist": "Phineas and Ferb",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781787275/Phineas_and_Ferb_-_Intro_%E0%AE%A4%E0%AE%AE%E0%AE%B4Tamil_qknjtn.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781787311/vidssave.com_Phineas_and_Ferb_-_Intro_%E0%AE%A4%E0%AE%BF%E0%AE%B4%E0%AF%8D_Tamil_720P_ldxv5g.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        }
    ];
    let libraryTracks = JSON.parse(localStorage.getItem('stressTuneLibrary')) || defaultTracks;

    // Ensure the new songs are added if not present
    const hasSadSong = libraryTracks.some(t => t.title === "Sad Song");
    if (!hasSadSong) {
        libraryTracks.push({ 
            "title": "Sad Song", 
            "artist": "We The Kings ft. Elena Coats", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778179435/We_The_Kings_-_Sad_Song_Lyric_Video_ft._Elena_Coats_y2vbxu.mp3", 
            "cover": "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778179316/download_b4rtyo.jpg",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888030/vidssave.com_AMV_-_Sad_Song_%E1%B4%B4%E1%B4%B0_720P_v2xdqt.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Sad Song");
        if (track) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888030/vidssave.com_AMV_-_Sad_Song_%E1%B4%B4%E1%B4%B0_720P_v2xdqt.mp4";
        }
    }

    const hasLineWithoutHook = libraryTracks.some(t => t.title.includes("Line Without a Hook"));
    if (hasLineWithoutHook) {
        const index = libraryTracks.findIndex(t => t.title.includes("Line Without a Hook"));
        const track = libraryTracks.splice(index, 1)[0];
        track.title = "Line Without a Hook";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778180350/videoplayback_sopenc.mp4";
        track.cover = "neon_beats.png";
        libraryTracks.unshift(track); // Move to front
    }

    const hasHikaruNara = libraryTracks.some(t => t.title === "Hikaru Nara");
    if (!hasHikaruNara) {
        libraryTracks.push({ 
            "title": "Hikaru Nara", 
            "artist": "Goose house", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778215441/Hikaru_Nara_-_Goose_House_Romaji_Espa%C3%B1ol_English_Color_Coded_jehopo.mp3", 
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778216563/Your_Lie_in_April_OP_Opening_Theme_-_Hikaru_Nara_-_AniClipsCollection_720p_h264_okikjc.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Hikaru Nara");
        track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778215441/Hikaru_Nara_-_Goose_House_Romaji_Espa%C3%B1ol_English_Color_Coded_jehopo.mp3";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778216563/Your_Lie_in_April_OP_Opening_Theme_-_Hikaru_Nara_-_AniClipsCollection_720p_h264_okikjc.mp4";
    }

    const hasKingsQueens = libraryTracks.some(t => t.title === "KINGS QUEENS");
    if (hasKingsQueens) {
        const track = libraryTracks.find(t => t.title === "KINGS QUEENS");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778215631/Classroom_of_the_Elite_III_AMV_Kings_Queens_-_Luc%D1%87_%D3%87%D1%94%CE%B1rt%E1%83%A6_720p_h264_bqgpfe.mp4";
    }

    const hasFairytale = libraryTracks.some(t => t.title === "Fairytale");
    if (hasFairytale) {
        const track = libraryTracks.find(t => t.title === "Fairytale");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778438594/vidssave.com_Fairytale_-_AMV_-_Anime_MIX_720P_bvwxet.mp4";
    }

    const hasPerfectLyrics = libraryTracks.some(t => t.title === "Perfect Lyrics");
    if (hasPerfectLyrics) {
        const track = libraryTracks.find(t => t.title === "Perfect Lyrics");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482939/vidssave.com_Perfect_-_AMV_-_Anime_MV_720p60_wxckgb.mp4";
    }

    const hasDieWithASmile = libraryTracks.some(t => t.title === "Die With A Smile");
    if (hasDieWithASmile) {
        const track = libraryTracks.find(t => t.title === "Die With A Smile");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217207/Die_With_A_Smile_Eren_X_Mikasa_AMV_-_ToastLmao_1080p_h264_mgn6x0.mp4";
        track.cover = "zen_garden.png";
    }

    const hasLoveStory = libraryTracks.some(t => t.title === "Love Story Lyrics");
    if (hasLoveStory) {
        const track = libraryTracks.find(t => t.title === "Love Story Lyrics");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217932/Love_story_...Follow_sliceofanime_0_for_more_..._pokemon_theghostofmaidenspeak_sadanimeedit_mds8xw.mp4";
    }

    const hasLoveMeLikeYouDo = libraryTracks.some(t => t.title === "Love Me Like You Do Lyrics");
    if (hasLoveMeLikeYouDo) {
        const track = libraryTracks.find(t => t.title === "Love Me Like You Do Lyrics");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482299/vidssave.com_amu_ikuto___love_me_like_you_do_720P_lzsffp.mp4";
    }

    const hasAThousandYears = libraryTracks.some(t => t.title === "A Thousand Years");
    if (hasAThousandYears) {
        const track = libraryTracks.find(t => t.title === "A Thousand Years");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217932/Love_story_...Follow_sliceofanime_0_for_more_..._pokemon_theghostofmaidenspeak_sadanimeedit_mds8xw.mp4";
    }

    const hasAnotherLove = libraryTracks.some(t => t.title === "Another Love Lyrics");
    if (hasAnotherLove) {
        const track = libraryTracks.find(t => t.title === "Another Love Lyrics");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778218884/Sanji_Pudding_Their_Story_-_Another_Love_AMV_-_Riddler_Thriller_1080p_h264_twghwl.mp4";
    }

    const hasMortals = libraryTracks.some(t => t.title === "Mortals");
    if (!hasMortals) {
        libraryTracks.push({ 
            "title": "Mortals", 
            "artist": "Warriyo ft. Laura Brehm", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778231345/Warriyo_-_Mortals_ft._Laura_Brehm_o8vhwd.mp3", 
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778231291/vidssave.com_Hayato_Awakening___Garena_Free_Fire_720P_ysgs64.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Mortals");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778231291/vidssave.com_Hayato_Awakening___Garena_Free_Fire_720P_ysgs64.mp4";
    }

    const hasAloneXFaded = libraryTracks.some(t => t.title === "Alone x Fadded");
    if (!hasAloneXFaded) {
        libraryTracks.push({ 
            "title": "Alone x Fadded", 
            "artist": "Alan Walker Mashup", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778231726/Alan_Walker_Mashup_Lyrics_Alone_X_Faded_X_Alone_Pt._2_X_On_My_Way..._alanwalker_fadedxaloneptii_afscdd.mp3", 
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778231741/vidssave.com_ANIME_EYES_EDIT___THIS_IS_4K_ANIME_EYES___PEPEKACHU_1080P_izqkmk.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Alone x Fadded");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778231741/vidssave.com_ANIME_EYES_EDIT___THIS_IS_4K_ANIME_EYES___PEPEKACHU_1080P_izqkmk.mp4";
    }
    const hasCourtesyCall = libraryTracks.some(t => t.title === "Courtesy Call");
    if (hasCourtesyCall) {
        const track = libraryTracks.find(t => t.title === "Courtesy Call");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778232193/vidssave.com_Kalos_League_Showdown_AMV_Courtesy_Call_-_Pokemon_XYZ_1080P_gzmf5b.mp4";
    }
    
    const hasDarkside = libraryTracks.some(t => t.title.includes("Darkside"));
    if (hasDarkside) {
        const track = libraryTracks.find(t => t.title.includes("Darkside"));
        track.title = "Darkside";
        track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778264297/NEONI_-_Darkside_Lyrics_soia8k.mp3";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778264000/vidssave.com_The_Eminence_in_Shadow_AMV_-_Darkside_1080P_uo8vq9.mp4";
    }
    
    const hasGangstasParadise = libraryTracks.some(t => t.title.includes("Gangsta s Paradise"));
    if (hasGangstasParadise) {
        const track = libraryTracks.find(t => t.title.includes("Gangsta s Paradise"));
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778263902/AMV_-_Tokyo_revengers_-_gangster_paradise_Toman_vs_Valhalla_xkehvs.mp4";
    }

    const hasLastOneStanding = libraryTracks.some(t => t.title.includes("Last One Standing"));
    if (hasLastOneStanding) {
        const track = libraryTracks.find(t => t.title.includes("Last One Standing"));
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778329581/YTDown_YouTube_SAO-AMV-Kirito-Tribute-Last-One-Standing_Media_rJvH7oOSRBQ_001_720p_ezytk3.mp4";
    }

    const hasShatterMe = libraryTracks.some(t => t.title.includes("Shatter Me"));
    if (!hasShatterMe) {
        libraryTracks.push({ 
            "title": "Shatter Me", 
            "artist": "Lindsey Stirling ft. Lzzy Hale", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778346095/Lindsey_Stirling_-_Shatter_Me_ft._Lzzy_Hale_Lyrics_wztopr.mp3", 
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778345854/YTDown_YouTube_Naofumi-_-Raphtalia-Shatter-Me-AMV_Media_ffiphpTEZS8_001_720p_qlou9a.mp4"
        });
    }
    
    const hasLegendsNeverDie = libraryTracks.some(t => t.title.includes("League of Legends"));
    if (hasLegendsNeverDie) {
        const track = libraryTracks.find(t => t.title.includes("League of Legends"));
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778345464/vidssave.com_Legends_Never_Die___Ezio_Auditore___Assassin_s_Creed___GMV_1080p_bjgz4d.mp4";
    }

    const hasRoyaltyXMadara = libraryTracks.some(t => {
        const tLower = t.title.toLowerCase();
        return (tLower.includes("madara") || tLower.includes("maadara")) && !tLower.includes("centuries");
    });
    if (!hasRoyaltyXMadara) {
        libraryTracks.push({ 
            "title": "Royalty X Madara", 
            "artist": "Madara Uchiha AMV", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778350313/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_48KBPS_ah4y1q.webm", 
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778350407/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_2160P_bwgy18.mp4"
        });
    } else {
        const track = libraryTracks.find(t => {
            const tLower = t.title.toLowerCase();
            return (tLower.includes("madara") || tLower.includes("maadara")) && !tLower.includes("centuries");
        });
        if (track) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778350407/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_2160P_bwgy18.mp4";
        }
    }
    
    const hasYoasobi = libraryTracks.some(t => t.title.includes("YOASOBI アイドル"));
    if (hasYoasobi) {
        const track = libraryTracks.find(t => t.title.includes("YOASOBI アイドル"));
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778387693/YTDown_YouTube_Media_ZRtdQ81jPUQ_002_720p_mjwhn5.mp4";
    }

    const hasMyDemons = libraryTracks.some(t => t.title === "My Demons");
    if (!hasMyDemons) {
        libraryTracks.push({ 
            "title": "My Demons", 
            "artist": "Starset", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778431256/Starset-My_Demons_Lyrics_Video_u1952b.mp3", 
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778431420/beyblade-amv-my-demons-720-ytshorts.savetube.me_e2w4e9.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "My Demons");
        track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778431256/Starset-My_Demons_Lyrics_Video_u1952b.mp3";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778431420/beyblade-amv-my-demons-720-ytshorts.savetube.me_e2w4e9.mp4";
    }

    const hasStayWithMe = libraryTracks.some(t => t.title === "Stay with me");
    if (!hasStayWithMe) {
        libraryTracks.push({ 
            "title": "Stay with me", 
            "artist": "Heavenly Jumpstyle", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778434792/HEAVENLY_JUMPSTYLE_Lyrics_woamjr.mp3", 
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778434595/YTDown_Shorts_Resting-My-Eyes-Leon-Kennedy-Edit-HEAVEN_Media_9uZk7Ugr-Zc_002_720p_nf450q.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Stay with me");
        track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778434792/HEAVENLY_JUMPSTYLE_Lyrics_woamjr.mp3";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778434595/YTDown_Shorts_Resting-My-Eyes-Leon-Kennedy-Edit-HEAVEN_Media_9uZk7Ugr-Zc_002_720p_nf450q.mp4";
    }

    const hasDynasty = libraryTracks.some(t => t.title === "Dynasty");
    if (!hasDynasty) {
        libraryTracks.push({ 
            "title": "Dynasty", 
            "artist": "MIIA", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483126/MIIA_-_Dynasty_Lyrics_db8g63.mp3", 
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482821/YTDown_YouTube_Dynasty-AMV-Anime-Mix_Media_pmN_l7FuyIg_002_720p_vbrqdr.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Dynasty");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482821/YTDown_YouTube_Dynasty-AMV-Anime-Mix_Media_pmN_l7FuyIg_002_720p_vbrqdr.mp4";
    }

    const hasLoveIsGone = libraryTracks.some(t => t.title === "Love is Gone");
    if (!hasLoveIsGone) {
        libraryTracks.push({ 
            "title": "Love is Gone", 
            "artist": "SLANDER ft. Dylan Matthew", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483122/SLANDER_-_Love_Is_Gone_ft._Dylan_Matthew_Acoustic_j4pugd.mp3", 
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778482360/vidssave.com_Love_Is_Gone_AMV_MIX_1080P_ivxwrs.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Love is Gone");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778482360/vidssave.com_Love_Is_Gone_AMV_MIX_1080P_ivxwrs.mp4";
    }

    const hasInfinity = libraryTracks.some(t => t.title === "Infinity");
    if (!hasInfinity) {
        libraryTracks.push({ 
            "title": "Infinity", 
            "artist": "Jaymes Young", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483293/Jaymes_Young_-_Infinity_h8k3qg.mp3", 
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778482714/vidssave.com_AMV_-_Infinity_%E1%B4%B4%E1%B4%B0_1080P_ka9jub.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Infinity");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778482714/vidssave.com_AMV_-_Infinity_%E1%B4%B4%E1%B4%B0_1080P_ka9jub.mp4";
    }

    const hasWarriors = libraryTracks.some(t => t.title.toLowerCase().includes("warriors"));
    if (!hasWarriors) {
        libraryTracks.push({
            "title": "Warriors",
            "artist": "Imagine Dragons",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779546594/Imagine_Dragons_-_Warriors_Lyrics_kq7uoe.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546708/YTDown_YouTube_Beyblade-Burst-AMV-Shu-Kurenai-Warriors_Media_oZGFW0kKQZg_002_720p_tyzvjn.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title.toLowerCase().includes("warriors"));
        track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779546594/Imagine_Dragons_-_Warriors_Lyrics_kq7uoe.mp3";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546708/YTDown_YouTube_Beyblade-Burst-AMV-Shu-Kurenai-Warriors_Media_oZGFW0kKQZg_002_720p_tyzvjn.mp4";
    }

    const hasMonsters = libraryTracks.some(t => t.title.toLowerCase().includes("monster"));
    if (!hasMonsters) {
        libraryTracks.push({
            "title": "Monsters",
            "artist": "Skillet",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779547135/Skillet_-_Monster_Lyrics_so9wtg.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546613/YTDown_YouTube_Beyblade-amv-Kai-vs-Tyson-I-feel-like-a-_Media_H_2gXjAGUJg_001_480p_jxbtvc.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title.toLowerCase().includes("monster"));
        track.title = "Monsters";
        track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779547135/Skillet_-_Monster_Lyrics_so9wtg.mp3";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546613/YTDown_YouTube_Beyblade-amv-Kai-vs-Tyson-I-feel-like-a-_Media_H_2gXjAGUJg_001_480p_jxbtvc.mp4";
    }

    const hasSomeoneYouLoved = libraryTracks.some(t => t.title.toLowerCase().includes("someone you loved") || t.title.toLowerCase().includes("some you loved"));
    if (!hasSomeoneYouLoved) {
        libraryTracks.push({
            "title": "Someone You Loved",
            "artist": "Lewis Capaldi",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779888678/Lewis_Capaldi_-_Someone_You_Loved_Lyrics_bcrgau.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888291/YTDown_YouTube_Media_N-uPKh23-40_002_720p_nhibvs.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title.toLowerCase().includes("someone you loved") || t.title.toLowerCase().includes("some you loved"));
        track.title = "Someone You Loved";
        track.artist = "Lewis Capaldi";
        track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1779888678/Lewis_Capaldi_-_Someone_You_Loved_Lyrics_bcrgau.mp3";
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888291/YTDown_YouTube_Media_N-uPKh23-40_002_720p_nhibvs.mp4";
    }

    // Force migration: Remove any lingering profile images from song covers
    libraryTracks.forEach((track, idx) => {
        if (track.cover && track.cover.includes("download_b4rtyo.jpg")) {
            const fallbackCovers = ["neon_beats.png", "zen_garden.png", "midnight_rain.png"];
            track.cover = fallbackCovers[idx % fallbackCovers.length];
        }
    });
    
    // Patch canvas for "Young and Beautiful 1" (Lana Del Rey) for existing localStorage users
    const youngAndBeautiful = libraryTracks.find(t => t.title === "Young and Beautiful 1");
    if (youngAndBeautiful) {
        youngAndBeautiful.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778681313/YTDown_YouTube_Nezuko-AMV-Young-And-Beautiful_Media_Y4Wvr0SHpgo_001_720p_t8n74r.mp4";
    }

    // Patch canvas for "Rise" (Unknown Artist)
    const riseTrack = libraryTracks.find(t => t.title === "Rise" && t.artist === "Unknown Artist");
    if (riseTrack) {
        riseTrack.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779889021/YTDown_YouTube_Tensei-Shitara-Slime-Datta-Ken-AMV-Rise-_Media_ruCbOOnrXb8_002_720p_pwytjn.mp4";
    }

    // Patch canvas for "Passenger Let Her Go Official Video"
    const letHerGo = libraryTracks.find(t => t.title.toLowerCase().includes("let her go"));
    if (letHerGo) {
        letHerGo.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888108/vidssave.com_Let_Her_Go_-_Hyouka_720P_cg4jy4.mp4";
    }

    // Patch canvas for "Rise Up Lyrics"
    const riseUp = libraryTracks.find(t => t.title === "Rise Up Lyrics" || t.title === "Rise Up");
    if (riseUp) {
        riseUp.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778683202/YTDown_YouTube_AMV-Rise-Up-Anime-Mix_Media_SQgphp0w_TY_002_720p_s6slh5.mp4";
    }

    // Patch canvas for "Mockingbird Lyrics" (Eminem)
    const mockingbird = libraryTracks.find(t => t.title === "Mockingbird Lyrics" || t.title === "Mockingbird");
    if (mockingbird) {
        mockingbird.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/q_auto,f_auto,w_1280,c_limit/v1778683201/vidssave.com_Spy_x_Family_-_Mockingbird_AMV_1080P_f6t6qr.mp4";
    }

    // Patch canvas for "I Wanna Be Yours Lyrics"
    const iWannaBeYours = libraryTracks.find(t => t.title === "I Wanna Be Yours Lyrics" || t.title === "I Wanna Be Yours");
    if (iWannaBeYours) {
        iWannaBeYours.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779094469/I_WANNA_BE_YOURS_AMV_lhzb07.mp4";
    }

    // Patch canvas for "Dandelions Lyrics"
    const dandelions = libraryTracks.find(t => t.title === "Dandelions Lyrics" || t.title === "Dandelions");
    if (dandelions) {
        dandelions.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779095683/Dandelions_-_AMV_-_Anime_MV_xvlg0y.mp4";
    }

    // Patch canvas for "Unforgettable freestyle lyrics"
    const unforgettable = libraryTracks.find(t => t.title === "Unforgettable freestyle lyrics" || t.title === "Unforgettable");
    if (unforgettable) {
        unforgettable.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779095663/Pnb_Rock_-_Unforgettable_Freestyle_AMV_EDIT_Free_Preset_Edit_By_Galaxy_Edit_z_pnbrocktypebeat_dkv6wo.mp4";
    }

    // Patch canvas for "Heat Waves Full Version"
    const heatWaves = libraryTracks.find(t => t.title === "Heat Waves Full Version" || t.title === "Heat Waves");
    if (heatWaves) {
        heatWaves.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779198119/Heat_Waves_-_AMV_-_Anime_MV_h8pxs0.mp4";
    }

    // Robust Patch for "Summertime Sadness" (Lana Del Rey) - Handles any title variation
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("summertime sadness")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779888076/vidssave.com_AMV_Anime_mix_-_Summertime_Sadness_HD_720P_jrfi7a.mp4";
        }
    });

    // Robust Patch for "The Nights" (Avicii) - Handles any title variation
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("the nights")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778683695/vidssave.com_One_piece-MV_Avicii-The_Nights_720P_ye2hqn.mp4";
        }
    });

    // Robust Patch for "Love Me Not" (Ravyn Lenae) - Handles any title variation
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("love me not")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779544700/YTDown_YouTube_Love-Me-Not-A-Silent-Voice-AMV_Media_QFEiHhoaD1U_002_720p_hgg34f.mp4";
        }
    });

    // Robust Patch for "Not Gonna Die" (Skillet) - Handles any title variation
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("not gonna die")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779544948/YTDown_YouTube_Beyblade-Kai-not-gonna-die-Amv_Media_8VwC-2bEF1U_002_720p_ls6fya.mp4";
        }
    });

    // Robust Patch for "The Resistance" (Skillet) - Handles any title variation
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("the resistance")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779546652/YTDown_YouTube_Beyblade-Burst-AMV-Resistance_Media_fj8p1pJmMLo_001_720p_b5z4xe.mp4";
        }
    });

    // Robust Patch for "APT. Official Music Video" (ROSÉ & Bruno Mars) - Handles any title variation
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("apt.")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1779709552/vidssave.com_ROS%C3%89_Bruno_Mars_-_APT._Official_Music_Video_720p_zbgy5p.mp4";
        }
    });

    // Check and add Gracie Abrams - That's so True
    const hasThatsSoTrue = libraryTracks.some(t => t.title === "That's so True");
    if (!hasThatsSoTrue) {
        libraryTracks.push({
            "title": "That's so True",
            "artist": "Gracie Abrams",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835555/Gracie_Abrams_-_Thats_So_True_Lyrics_vdk0ni.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780835141/vidssave.com_That_s_so_true_-_Anime_mix_AMV_EDIT_720P_glojlt.mp4"
        });
    }

    // Check and add The Neighbourhood - Sweater Weather
    const hasSweaterWeather = libraryTracks.some(t => t.title === "Sweater Weather");
    if (!hasSweaterWeather) {
        libraryTracks.push({
            "title": "Sweater Weather",
            "artist": "The Neighbourhood",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835203/The_Neighbourhood_-_Sweater_Weather_Lyrics_rvb1eg.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780934192/AMV_-_Sweater_Weather_James_Harris_-_Anime_Mix_-_Yuki._640p_dwum1a.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Sweater Weather");
        if (track) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1780934192/AMV_-_Sweater_Weather_James_Harris_-_Anime_Mix_-_Yuki._640p_dwum1a.mp4";
        }
    }

    // Check and add Melanie Martinez - Play Date
    const hasPlayDate = libraryTracks.some(t => t.title === "Play Date");
    if (!hasPlayDate) {
        libraryTracks.push({
            "title": "Play Date",
            "artist": "Melanie Martinez",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835226/Melanie_Martinez_-_Play_Date_Lyrics_wnscjy.mp3",
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780835943/vidssave.com_Play_Date_AMV_-_Anime_MV_720P_nmbdzh.mp4"
        });
    }

    // Check and add Lady Gaga - Bloody Mary
    const hasBloodyMary = libraryTracks.some(t => t.title === "Bloody Mary");
    if (!hasBloodyMary) {
        libraryTracks.push({
            "title": "Bloody Mary",
            "artist": "Lady Gaga",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1780835197/Lady_Gaga_-_Bloody_Mary_ofcdeb.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1780835103/vidssave.com_Wednesday_Dance_-_Lady_Gaga_-_Bloody_Mary_720p_kigppu.mp4"
        });
    }

    // Check and add Attack on Titan
    const hasAttackOnTitan = libraryTracks.some(t => t.title === "Attack on Titan");
    if (!hasAttackOnTitan) {
        libraryTracks.push({
            "title": "Attack on Titan",
            "artist": "Ai Higuchi",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781786111/%E3%83%92%E3%82%B0%E3%83%81%E3%82%A2%E3%82%A4_%E6%82%AA%E9%AD%94%E3%81%AE%E5%AD%90_%E3%82%A2%E3%83%8B%E3%83%A1%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%ABVer._Ai_Higuchi_Akuma_no_Ko_Anime_Special_Ver._1_arjzam.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781786069/vidssave.com_%E3%83%92%E3%82%B0%E3%83%81%E3%82%A2%E3%82%A4___%E6%82%AA%E9%AD%94%E3%81%AE%E5%AD%90_%E3%82%A2%E3%83%8B%E3%83%A1%E3%82%B9%E3%83%9A%E3%82%B7%E3%83%A3%E3%83%ABVer.___Ai_Higuchi_Akuma_no_Ko_Anime_Special_Ver._720p_1_bmjsc0.mp4"
        });
    }

    // Check and add Bink's Sake
    const hasBinksSake = libraryTracks.some(t => t.title === "Bink's Sake");
    if (!hasBinksSake) {
        libraryTracks.push({
            "title": "Bink's Sake",
            "artist": "One Piece",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781786090/One_Piece_OST_-_Binks_no_Sake_Strawhat_Version_Lyrics_xsovfc.mp3",
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781786171/vidssave.com_one_piece_binks_no_sake_sub_espanol_romajiamv_720P_qy8zep.mp4"
        });
    }

    // Check and add Waka Waka
    const hasWakaWaka = libraryTracks.some(t => t.title === "Waka Waka");
    if (!hasWakaWaka) {
        libraryTracks.push({
            "title": "Waka Waka",
            "artist": "Shakira",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781719136/Shakira_-_Waka_Waka_This_Time_for_Africa_The_Official_2010_FIFA_World_Cup_Song_i208vx.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781719013/vidssave.com_Shakira_-_Waka_Waka_This_Time_for_Africa_The_Official_2010_FIFA_World_Cup_Song_720P_huw1tm.mp4"
        });
    }

    // Check and add Bye Bye
    const hasByeBye = libraryTracks.some(t => t.title === "Bye Bye");
    if (!hasByeBye) {
        libraryTracks.push({
            "title": "Bye Bye",
            "artist": "NSYNC",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781719130/Bye_Bye_Bye_Opening_Scene_DEADPOOL_WOLVERINE_2024_Movie_CLIP_HD_lyvwtf.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781718947/vidssave.com_Bye_Bye_Bye_Opening_Scene___DEADPOOL_WOLVERINE_2024_Movie_CLIP_HD_1080P_zt1cdq.mp4"
        });
    }

    // Check and add Warrior Inside
    const hasWarriorInside = libraryTracks.some(t => t.title === "Warrior Inside");
    if (!hasWarriorInside) {
        libraryTracks.push({
            "title": "Warrior Inside",
            "artist": "Beyblade",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1783859747/Beyblade_AMV_-_Warrior_Inside_a6r7rs.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1783859784/YTDown.com_YouTube_Beyblade-AMV-Warrior-Inside_Media_nn7lRc0_iAc_002_720p_zwnuwy.mp4"
        });
    }

    // Check and add Centuries
    const hasCenturies = libraryTracks.some(t => t.title === "Centuries");
    if (!hasCenturies) {
        libraryTracks.push({
            "title": "Centuries",
            "artist": "Fall Out Boy",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1783861599/Madara_Uchiha_AMV_-_Centuries_pgjail.mp3",
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1783861621/YTDown.com_YouTube_Madara-Uchiha-AMV-Centuries_Media_esJOOQG42r0_001_720p_ql2ccn.mp4"
        });
    }

    // Check and add Believer
    const hasBeliever = libraryTracks.some(t => t.title === "Believer");
    if (!hasBeliever) {
        libraryTracks.push({
            "title": "Believer",
            "artist": "Imagine Dragons",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1783860831/Charizard_Greninja_Infernape_Lycanroc_AMV_-_Believer_jw8wfm.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1783860953/YTDown.com_YouTube_Charizard-Greninja-Infernape-Lycanroc-AM_Media_THflA-4Itaw_002_720p_r5vgl9.mp4"
        });
    }

    // Check and add Shameless
    const hasShameless = libraryTracks.some(t => t.title === "Shameless");
    if (!hasShameless) {
        libraryTracks.push({
            "title": "Shameless",
            "artist": "Camila Cabello",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1785574107/Camila_Cabello_-_Shameless_utlquw.mp3",
            "cover": "midnight_rain.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785574164/vidssave.com_Shameless_-_Demon_Slayer_AMV_720P_i0k0qt.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Shameless");
        if (track) {
            track.artist = "Camila Cabello";
            track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1785574107/Camila_Cabello_-_Shameless_utlquw.mp3";
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1785574164/vidssave.com_Shameless_-_Demon_Slayer_AMV_720P_i0k0qt.mp4";
        }
    }

    // Check and add Darkside 2
    const hasDarkside2 = libraryTracks.some(t => t.title === "Darkside 2");
    if (!hasDarkside2) {
        libraryTracks.push({
            "title": "Darkside 2",
            "artist": "NEONI",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093581/NEONI_-_Darkside_Lyrics_mbp67u.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785575094/vidssave.com_Darkside_AMV_Anime_Mix_720P_dscnqw.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Darkside 2");
        if (track) {
            track.artist = "NEONI";
            track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093581/NEONI_-_Darkside_Lyrics_mbp67u.mp3";
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1785575094/vidssave.com_Darkside_AMV_Anime_Mix_720P_dscnqw.mp4";
        }
    }

    // Check and add Bumble Bee
    const hasBumbleBee = libraryTracks.some(t => t.title === "Bumble Bee");
    if (!hasBumbleBee) {
        libraryTracks.push({
            "title": "Bumble Bee",
            "artist": "Nightcore",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1785588159/Nightcore_Sweet_Little_Bumblebee_lyric_video_skehr5.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1785588186/vidssave.com_Nightcore___Sweet_Little_Bumblebee_lyric_video_720P_kgbncy.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Bumble Bee");
        if (track) {
            track.artist = "Nightcore";
            track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1785588159/Nightcore_Sweet_Little_Bumblebee_lyric_video_skehr5.mp3";
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1785588186/vidssave.com_Nightcore___Sweet_Little_Bumblebee_lyric_video_720P_kgbncy.mp4";
        }
    }

    // Check and add Caramella Girls - Caramelldansen
    const hasCaramelldansen = libraryTracks.some(t => t.title.toLowerCase().includes("caramelldansen"));
    if (!hasCaramelldansen) {
        libraryTracks.push({
            "title": "Caramelldansen HD Version (Swedish Original)",
            "artist": "Caramella Girls",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1787040726/Caramella_Girls_-_Caramelldansen_HD_Version_Swedish_Original_guyspl.mp3",
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1787040709/vidssave.com_Caramella_Girls_-_Caramelldansen_HD_Version_Swedish_Original_720p_hq9h82.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title.toLowerCase().includes("caramelldansen"));
        if (track) {
            track.artist = "Caramella Girls";
            track.url = "https://res.cloudinary.com/dhocv2p3t/video/upload/v1787040726/Caramella_Girls_-_Caramelldansen_HD_Version_Swedish_Original_guyspl.mp3";
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1787040709/vidssave.com_Caramella_Girls_-_Caramelldansen_HD_Version_Swedish_Original_720p_hq9h82.mp4";
        }
    }

    // Robust Patch for "Royalty ft. Neoni Official"
    libraryTracks.forEach(track => {
        const titleLower = track.title.toLowerCase();
        if (titleLower.includes("royalty") && !titleLower.includes("madara") && !titleLower.includes("maadara")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1785575408/vidssave.com_Royalty_-_AMV_Anime_Mix_720P_qppstz.mp4";
        }
    });

    // Robust Patch for "Royalty X Madara" / "Madara X Royalty" / "Royalty X Maadara"
    libraryTracks.forEach(track => {
        const titleLower = track.title.toLowerCase();
        if ((titleLower.includes("madara") || titleLower.includes("maadara")) && !titleLower.includes("centuries")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778350407/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_2160P_bwgy18.mp4";
        }
    });

    // Robust Patch for "Animals Lyrics"
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("animals")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1785575922/vidssave.com_Animals_-_AMV_Anime_Mix_720p_bpiafr.mp4";
        }
    });

    // Robust Patch for "Moral Of The Story"
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("moral of the story")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1785576399/Moral_of_the_Story_-_AMV_-_Anime_MV_t6jyln.mp4";
        }
    });

    // Robust Patch for "Let Me Down Slowly" (Alec Benjamin)
    libraryTracks.forEach(track => {
        if (track.title.toLowerCase().includes("let me down slowly")) {
            track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1787043078/vidssave.com_Let_Me_Down_Slowly_AMV_-_Anime_Mix_720P_1_bb6wy9.mp4";
        }
    });

    // Reset/Initialize Olden Days playlist to be empty by default
    if (!localStorage.getItem('stressTuneOldenDaysReset')) {
        libraryTracks.forEach(track => {
            track.inGoldenDays = false;
        });
        localStorage.setItem('stressTuneOldenDaysReset', 'true');
    }

    // Add and ensure Olden Days only tracks
    const newOldenDaysSongs = [
        {
            "title": "Pokemon Season 1 Opening",
            "artist": "Pokémon",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781268669/Pok%C3%A9mon_Season_1_Opening_in_Tamil_jngk1k.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203417/vidssave.com_Pok%C3%A9mon_Season_1_Opening_in_Tamil_360P_lz7ly2.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Spectacular Spider Man Opening",
            "artist": "The Spectacular Spider-Man",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781202505/Spectacular_Spider-Man_Music_Video_rewrmi.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203293/vidssave.com_Spectacular_Spider-Man_Music_Video_720P_oumz3b.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Kickbatoski \"Thadaladi\"",
            "artist": "Kick Buttowski",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781202485/Kick_Buttowski_Intro_mi5luu.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203346/vidssave.com_Kick_Buttowski_Intro_720P_hflsfk.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Doremon 1979 Opening",
            "artist": "Doraemon",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781269856/Doraemon_1979_1st_Opening_Theme_in_Tamil_With_Lyrics_dsopxr.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781269825/Doraemon_1979_Opening_Theme_Song_HD_enqlpo.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Doremon New Song",
            "artist": "Doraemon",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781202955/Doraemon_New_Intro_Song_in_Tamil_uysqjm.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203370/vidssave.com_Doraemon_New_Intro_Song_in_Tamil_720P_zisfkw.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Yokai Watch",
            "artist": "Yo-kai Watch",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781270348/%E5%A6%96%E6%80%AA%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81%E5%85%AC%E5%BC%8F%E3%82%AA%E3%83%BC%E3%83%97%E3%83%8B%E3%83%B3%E3%82%B0%E7%AC%AC1%E5%BC%BE_%E3%82%B2%E3%83%A9%E3%82%B2%E3%83%A9%E3%83%9D%E3%83%BC%E3%81%AE%E3%81%86%E3%81%9F%E5%A6%96Tube_dhoq9z.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781203391/vidssave.com_%E5%A6%96%E6%80%AA%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81%E5%85%AC%E5%BC%8F_%E3%82%AA%E3%83%BC%E3%83%97%E3%83%8B%E3%83%B3%E3%82%B0%E7%AC%AC1%E5%BC%BE_%E3%82%B2%E3%83%A9%E3%82%B2%E3%83%A9%E3%83%9D%E3%83%BC%E3%81%AE%E3%81%86%E3%81%9F_%E5%A6%96Tube_720P_firsfn.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Ben 10",
            "artist": "Ben 10",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781786867/Ben_10_title_song_Tamil_jw1b4s.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781785163/vidssave.com_Ben_10_title_song_Tamil_360P_lopht9.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        },
        {
            "title": "Phineas and Ferb Opening",
            "artist": "Phineas and Ferb",
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1781787275/Phineas_and_Ferb_-_Intro_%E0%AE%A4%E0%AE%AE%E0%AE%B4Tamil_qknjtn.mp3",
            "cover": "olden_days_cover.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1781787311/vidssave.com_Phineas_and_Ferb_-_Intro_%E0%AE%A4%E0%AE%BF%E0%AE%B4%E0%AF%8D_Tamil_720P_ldxv5g.mp4",
            "inGoldenDays": true,
            "onlyGoldenDays": true
        }
    ];

    newOldenDaysSongs.forEach(newTrack => {
        const hasTrack = libraryTracks.some(t => t.title === newTrack.title);
        if (!hasTrack) {
            libraryTracks.push(newTrack);
        } else {
            const track = libraryTracks.find(t => t.title === newTrack.title);
            track.url = newTrack.url;
            track.canvas = newTrack.canvas;
            track.cover = newTrack.cover;
            track.artist = newTrack.artist;
            track.inGoldenDays = true;
            track.onlyGoldenDays = true;
        }
    });

    localStorage.setItem('stressTuneLibrary', JSON.stringify(libraryTracks));



    const renderHome = () => {
        const homeGrid = document.getElementById('home-grid');
        const mixesGrid = document.getElementById('mixes-grid');
        const homeGreeting = document.getElementById('home-greeting');

        if (homeGreeting) {
            const hour = new Date().getHours();
            let greeting = "Good evening";
            if (hour < 12) greeting = "Good morning";
            else if (hour < 18) greeting = "Good afternoon";
            homeGreeting.innerText = greeting;
        }

        if (homeGrid) {
            // Show all tracks from 'Music I 💙' on the home screen
            homeGrid.innerHTML = libraryTracks.filter(track => !track.onlyGoldenDays).map((track, index) => {
                const originalIndex = libraryTracks.indexOf(track);
                const isGolden = track.inGoldenDays;
                return `
                    <div class="card" onclick="playLibraryTrack(${originalIndex})">
                        <div style="position: relative; overflow: hidden; border-radius: var(--radius-md);">
                            <img src="${track.cover}" alt="${track.title}" class="card-img" style="margin-bottom:0;">
                            <div class="card-play-btn" style="position: absolute; bottom: 12px; right: 12px; width: 48px; height: 48px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateY(10px); transition: all 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 2;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                            <button onclick="toggleGoldenDaysTrack(${originalIndex}, event)" class="icon-btn playlist-toggle-btn ${isGolden ? 'in-playlist' : ''}" title="${isGolden ? 'Remove from Olden Days' : 'Add to Olden Days'}" style="position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; background: rgba(0,0,0,0.6); border-radius: 50%; backdrop-filter: blur(4px);">
                                <span style="font-size: 14px;">${isGolden ? '📀' : '➕'}</span>
                            </button>
                        </div>
                        <div class="card-title" style="margin-top: 16px;">${track.title}</div>
                        <div class="card-subtitle">${track.artist}</div>
                    </div>
                `;
            }).join('');
        }

        if (mixesGrid) {
            const mixes = [
                { title: "Stress Reliever Mix", subtitle: "Deeply calming beats", color1: "#0066FF", color2: "#000" },
                { title: "Electric Pulse", subtitle: "High energy rhythms", color1: "#00E5FF", color2: "#003333" }
            ];
            mixesGrid.innerHTML = mixes.map(mix => `
                <div class="card">
                    <div class="card-img" style="background: linear-gradient(135deg, ${mix.color1}, ${mix.color2}); display: flex; align-items: center; justify-content: center; margin-bottom: 0;">
                        <span style="font-size: 40px; font-weight: 800; opacity: 0.1; letter-spacing: 4px;">MIX</span>
                    </div>
                    <div class="card-title" style="margin-top: 16px;">${mix.title}</div>
                    <div class="card-subtitle">${mix.subtitle}</div>
                </div>
            `).join('');
        }
    };

    const renderLibrary = (query = "") => {
        const libCount = document.getElementById('lib-track-count');
        
        const filteredTracks = libraryTracks.filter(track => 
            !track.onlyGoldenDays && (
                track.title.toLowerCase().includes(query.toLowerCase()) || 
                track.artist.toLowerCase().includes(query.toLowerCase())
            )
        );

        if (libCount) libCount.innerText = `${filteredTracks.length} Tracks`;
        
        libraryTracklist.innerHTML = filteredTracks.map((track, index) => {
            const originalIndex = libraryTracks.indexOf(track);
            const isPlayingRow = (currentTrackIndex === originalIndex && currentQueue === libraryTracks);
            const isGolden = track.inGoldenDays;
            return `
                <tr class="song-row ${isPlayingRow ? 'playing' : ''}">
                    <td class="index">${index + 1}</td>
                    <td class="title-cell" onclick="playLibraryTrack(${originalIndex})">
                        <img src="${track.cover}" class="small-art">
                        <div>
                            <div class="song-title">${track.title}</div>
                            <div class="song-artist">${track.artist}</div>
                        </div>
                    </td>
                    <td class="duration">
                        <button onclick="toggleGoldenDaysTrack(${originalIndex}, event)" class="icon-btn playlist-toggle-btn ${isGolden ? 'in-playlist' : ''}" title="${isGolden ? 'Remove from Olden Days' : 'Add to Olden Days'}" style="display: inline-flex; margin-right: 8px;">
                            <span style="font-size: 14px;">${isGolden ? '📀' : '➕'}</span>
                        </button>
                        <button onclick="renameTrack(${originalIndex}, event)" class="icon-btn" style="display: inline-flex; margin-right: 8px; opacity: 0.6;" title="Rename Track">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        3:45
                    </td>
                </tr>
            `;
        }).join('');
    };

    const libSearchInput = document.getElementById('library-search');
    if(libSearchInput) {
        libSearchInput.addEventListener('input', (e) => {
            renderLibrary(e.target.value);
        });
    }

    const globalSearchInput = document.getElementById('global-search');
    if(globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const searchTracklist = document.getElementById('search-tracklist');
            if(!searchTracklist) return;
            
            if(query === "") {
                searchTracklist.innerHTML = "";
                return;
            }

            const filtered = libraryTracks.filter(track => 
                !track.onlyGoldenDays && (
                    track.title.toLowerCase().includes(query) || 
                    track.artist.toLowerCase().includes(query)
                )
            );

            searchTracklist.innerHTML = filtered.map((track, index) => {
                const originalIndex = libraryTracks.indexOf(track);
                const isPlayingRow = (currentTrackIndex === originalIndex && currentQueue === libraryTracks);
                const isGolden = track.inGoldenDays;
                return `
                    <tr class="song-row ${isPlayingRow ? 'playing' : ''}">
                        <td class="index">${index + 1}</td>
                        <td class="title-cell" onclick="playLibraryTrack(${originalIndex})">
                            <img src="${track.cover}" class="small-art">
                            <div>
                                <div class="song-title">${track.title}</div>
                                <div class="song-artist">${track.artist}</div>
                            </div>
                        </td>
                        <td class="duration">
                            <button onclick="toggleGoldenDaysTrack(${originalIndex}, event)" class="icon-btn playlist-toggle-btn ${isGolden ? 'in-playlist' : ''}" title="${isGolden ? 'Remove from Olden Days' : 'Add to Olden Days'}" style="display: inline-flex; margin-right: 8px;">
                                <span style="font-size: 14px;">${isGolden ? '📀' : '➕'}</span>
                            </button>
                            3:45
                        </td>
                    </tr>
                `;
            }).join('');
        });
    }

    window.renameTrack = (index, event) => {
        if (event) event.stopPropagation();
        const oldTitle = libraryTracks[index].title;
        const newTitle = prompt("Enter new title for this track:", oldTitle);
        
        if (newTitle && newTitle.trim() !== "") {
            libraryTracks[index].title = newTitle.trim();
            saveLibrary();
            renderLibrary();
            
            if (currentTrackIndex === index) {
                const track = libraryTracks[index];
                updateUI(track.title, track.artist, track.cover, track.canvas);
            }
        }
    };

    window.sortLibraryAlphabetically = () => {
        libraryTracks.sort((a, b) => a.title.localeCompare(b.title));
        renderLibrary();
        const sortBtn = document.querySelector('.btn-secondary');
        if(sortBtn) {
            sortBtn.innerText = 'SORTED A-Z';
            sortBtn.style.borderColor = 'var(--primary-blue)';
            sortBtn.style.color = 'var(--primary-blue)';
        }
    };

    // ── MUSIC I 💙 ORDERED QUEUE ─────────────────────────────────────────────
    // musicILoveQueue: all non-onlyGoldenDays tracks in their listed order
    // musicILoveIdx: current position within that queue
    let musicILoveQueue = [];
    let musicILoveIdx = -1;
    const QUEUE_MUSIC_I_LOVE = 'music_i_love';
    const QUEUE_OLDEN_DAYS   = 'olden_days';
    let activePlaylistId = null; // which playlist is currently driving playback

    const buildMusicILoveQueue = () => libraryTracks.filter(t => !t.onlyGoldenDays);

    window.playLibraryTrack = (index) => {
        // index is a libraryTracks index — map it to the Music I 💙 queue position
        musicILoveQueue = buildMusicILoveQueue();
        const queuePos = musicILoveQueue.findIndex(t => libraryTracks.indexOf(t) === index);
        musicILoveIdx = queuePos !== -1 ? queuePos : 0;
        activePlaylistId = QUEUE_MUSIC_I_LOVE;
        currentQueue = musicILoveQueue;
        currentTrackIndex = index;
        const track = musicILoveQueue[musicILoveIdx];
        playTrack(track.url, track.title, track.artist, track.cover, track.canvas);
        renderLibrary();
    };

    window.playAllLibrary = () => {
        musicILoveQueue = buildMusicILoveQueue();
        if (musicILoveQueue.length === 0) return;
        musicILoveIdx = 0;
        activePlaylistId = QUEUE_MUSIC_I_LOVE;
        currentQueue = musicILoveQueue;
        currentTrackIndex = libraryTracks.indexOf(musicILoveQueue[0]);
        const track = musicILoveQueue[0];
        playTrack(track.url, track.title, track.artist, track.cover, track.canvas);
        renderLibrary();
    };

    // ── OLDEN DAYS GOLDEN DAYS PLAYLIST ENGINE ──────────────────────────────

    let goldenPlaylistQueue = [];
    let isPlaylistSorted = false;
    let currentGoldenIdx = -1; // Tracks position within goldenPlaylistQueue

    const getGoldenTracks = () => libraryTracks.filter(t => t.inGoldenDays);

    const renderPlaylist = (query = "") => {
        let goldenTracks = getGoldenTracks();
        
        if (isPlaylistSorted) {
            goldenTracks.sort((a, b) => a.title.localeCompare(b.title));
        }

        const filtered = query
            ? goldenTracks.filter(t =>
                t.title.toLowerCase().includes(query.toLowerCase()) ||
                t.artist.toLowerCase().includes(query.toLowerCase())
              )
            : goldenTracks;

        // Update header
        const nameEl = document.getElementById('playlist-name');
        const taglineEl = document.getElementById('playlist-tagline');
        const descEl = document.getElementById('playlist-desc');
        const artEl = document.getElementById('playlist-art');
        const countEl = document.getElementById('playlist-track-count');

        if (nameEl) nameEl.innerHTML = '<span style="background:linear-gradient(90deg,#FFD700,#FFA500);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Olden days are Golden Days</span>';
        if (taglineEl) { taglineEl.innerText = 'YOUR CLASSICS'; taglineEl.style.color = '#FFD700'; }
        if (descEl) descEl.innerText = 'Timeless classics — from Perfect to Faded, these are the songs that defined an era.';
        if (artEl) { artEl.src = 'olden_days_cover.png'; artEl.style.borderRadius = 'var(--radius-lg)'; artEl.style.boxShadow = '0 12px 60px rgba(255,215,0,0.3)'; }
        if (countEl) countEl.innerText = `${filtered.length} Tracks`;

        // Render tracks
        const tracklistBody = document.getElementById('tracklist-body');
        if (!tracklistBody) return;
        goldenPlaylistQueue = filtered;

        if (filtered.length === 0) {
            tracklistBody.innerHTML = `<tr><td colspan="3" style="padding: 40px; text-align: center; color: var(--text-secondary);">${query ? 'No tracks match your search.' : 'No tracks in Olden Days yet. Add songs using the ➕ button!'}</td></tr>`;
            return;
        }

        tracklistBody.innerHTML = filtered.map((track, index) => {
            const originalIndex = libraryTracks.indexOf(track);
            const isPlayingRow = (currentTrackIndex === originalIndex && currentQueue === goldenPlaylistQueue);
            return `
                <tr class="song-row ${isPlayingRow ? 'playing' : ''}">
                    <td class="index" style="text-align:center;">${index + 1}</td>
                    <td class="title-cell" onclick="playPlaylistTrack(${index})">
                        <img src="${track.cover}" class="small-art">
                        <div>
                            <div class="song-title">${track.title}</div>
                            <div class="song-artist">${track.artist}</div>
                        </div>
                    </td>
                    <td class="duration" style="text-align:right;">
                        <button onclick="toggleGoldenDaysTrack(${originalIndex}, event)" class="icon-btn playlist-toggle-btn in-playlist" title="Remove from Olden Days" style="display: inline-flex;">
                            <span style="font-size:14px;">📀</span>
                        </button>
                        3:45
                    </td>
                </tr>
            `;
        }).join('');
    };

    window.playPlaylistTrack = (index) => {
        if (index < 0 || index >= goldenPlaylistQueue.length) return;
        activePlaylistId = QUEUE_OLDEN_DAYS;
        currentQueue = goldenPlaylistQueue;
        currentGoldenIdx = index;
        const track = goldenPlaylistQueue[index];
        currentTrackIndex = libraryTracks.indexOf(track);
        playTrack(track.url, track.title, track.artist, track.cover, track.canvas);
        const searchInput = document.getElementById('playlist-search');
        renderPlaylist(searchInput ? searchInput.value : "");
    };

    window.playAllPlaylist = () => {
        if (goldenPlaylistQueue.length === 0) return;
        activePlaylistId = QUEUE_OLDEN_DAYS;
        currentQueue = goldenPlaylistQueue;
        currentGoldenIdx = 0;
        const track = goldenPlaylistQueue[0];
        currentTrackIndex = libraryTracks.indexOf(track);
        playTrack(track.url, track.title, track.artist, track.cover, track.canvas);
        const searchInput = document.getElementById('playlist-search');
        renderPlaylist(searchInput ? searchInput.value : "");
    };

    window.sortPlaylistAlphabetically = () => {
        isPlaylistSorted = !isPlaylistSorted;
        const sortBtn = document.getElementById('playlist-sort-btn');
        if (sortBtn) {
            if (isPlaylistSorted) {
                sortBtn.innerText = 'SORTED A-Z';
                sortBtn.style.borderColor = '#FFD700';
                sortBtn.style.color = '#FFD700';
            } else {
                sortBtn.innerText = 'SORT A-Z';
                sortBtn.style.borderColor = 'var(--glass-border)';
                sortBtn.style.color = 'white';
            }
        }
        const searchInput = document.getElementById('playlist-search');
        renderPlaylist(searchInput ? searchInput.value : "");
    };

    window.toggleGoldenDaysTrack = (index, event) => {
        if (event) event.stopPropagation();
        if (libraryTracks[index].onlyGoldenDays) {
            alert("This classic theme is permanently pinned to the Olden Days playlist!");
            return;
        }
        libraryTracks[index].inGoldenDays = !libraryTracks[index].inGoldenDays;
        saveLibrary();
        // Re-render all active views
        renderLibrary();
        renderHome();
        const playlistView = document.getElementById('playlist-view');
        if (playlistView && playlistView.style.display !== 'none') {
            const searchInput = document.getElementById('playlist-search');
            renderPlaylist(searchInput ? searchInput.value : "");
        }
        // Re-render search if open
        const globalSearchInput = document.getElementById('global-search');
        if (globalSearchInput && globalSearchInput.value) {
            globalSearchInput.dispatchEvent(new Event('input'));
        }
    };

    // Playlist search input handler
    const playlistSearchInput = document.getElementById('playlist-search');
    if (playlistSearchInput) {
        playlistSearchInput.addEventListener('input', (e) => {
            renderPlaylist(e.target.value);
        });
    }

    window.showPlaylist = (name) => {
        showView('playlist-view');
        document.getElementById('playlist-name').innerText = name;
    };
    // ────────────────────────────────────────────────────────────────────────

    window.playTrack = (url, title, artist, cover, canvas) => {
        if (url === '#') return;
        initVisualizer();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        audio.src = url;
        audio.play();
        isPlaying = true;
        updateUI(title, artist, cover, canvas);
        updatePlayIcons();
        
        // Update highlights across views
        renderLibrary();
        const playlistViewEl = document.getElementById('playlist-view');
        if (playlistViewEl && playlistViewEl.style.display !== 'none') renderPlaylist();
    };

    const updateUI = (title, artist, cover, canvas) => {
        const playerName = document.getElementById('player-name');
        if (playerName) playerName.innerText = title;
        const playerArtist = document.getElementById('player-artist');
        if (playerArtist) playerArtist.innerText = artist;
        const playerArt = document.getElementById('player-art');
        if (playerArt) playerArt.src = cover;

        if (window.updateCastDisplay) window.updateCastDisplay();

        // Send Discord Notification if active
        sendDiscordNotification(title, artist, cover);

        // Desktop browser notification (skip on mobile)
        sendDesktopNotification(title, artist, cover);

        const overlayName = document.getElementById('overlay-name');
        const overlayArtist = document.getElementById('overlay-artist');
        if (overlayName) overlayName.innerText = title;
        if (overlayArtist) overlayArtist.innerText = artist;
        
        const video = document.getElementById('overlay-video');
        const centerVideo = document.getElementById('center-video');
        const overlayArt = document.getElementById('overlay-art');
        const overlay = document.getElementById('now-playing-overlay');

        if (overlayArt) overlayArt.src = cover;

        if (canvas && !isDataSaver) {
            // Setup Background Video
            if (video.src !== canvas) {
                video.src = canvas;
                video.load();
                video.currentTime = 0;
            }
            video.style.display = 'block';
            
            // Setup Center Video
            if (centerVideo) {
                if (centerVideo.src !== canvas) {
                    centerVideo.src = canvas;
                    centerVideo.load();
                    centerVideo.currentTime = 0;
                }
                centerVideo.style.display = 'block';
            }

            // Stable Sync Logic
            video.onplaying = () => {
                if (centerVideo) {
                    centerVideo.currentTime = video.currentTime; // Initial snap for perfect phase
                    if (centerVideo.paused) centerVideo.play().catch(() => {});
                }
            };
            video.onpause = () => {
                if (centerVideo) centerVideo.pause();
            };
            video.onseeking = () => {
                if (centerVideo) centerVideo.currentTime = video.currentTime;
            };

            // Start videos
            video.play().catch(() => {});
            if (centerVideo) {
                centerVideo.play().catch(() => {});
            }

            // Gentle Drift Sync (Checks every 5s, only fixes if drift > 1.5s)
            if (window.videoSyncInterval) clearInterval(window.videoSyncInterval);
            window.videoSyncInterval = setInterval(() => {
                if (centerVideo && !centerVideo.paused && !video.paused) {
                    if (Math.abs(video.currentTime - centerVideo.currentTime) > 1.5) {
                        centerVideo.currentTime = video.currentTime;
                    }
                }
            }, 5000);

            // Hide Static Art
            if (overlayArt) overlayArt.style.display = 'none';
            overlay.style.backgroundImage = 'none';
        } else {
            video.pause();
            video.src = '';
            video.style.display = 'none';
            
            if (centerVideo) {
                centerVideo.pause();
                centerVideo.src = '';
                centerVideo.style.display = 'none';
            }
            
            // Show Static Art
            if (overlayArt) overlayArt.style.display = 'block';
            overlay.style.backgroundImage = `url('${cover}')`;
            overlay.style.backgroundSize = 'cover';
            overlay.style.backgroundPosition = 'center';
        }
    };

    const updatePlayIcons = () => {
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.innerHTML = isPlaying ? pauseSVG : playSVG;
        });
    };

    // Player Controls
    const btnPlay = document.getElementById('btn-play');
    const btnPlayOverlay = document.getElementById('btn-play-overlay');
    const btnNext = document.getElementById('btn-next');
    const btnNextOverlay = document.getElementById('btn-next-overlay');
    const btnPrev = document.getElementById('btn-prev');
    const btnPrevOverlay = document.getElementById('btn-prev-overlay');
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnRepeat = document.getElementById('btn-repeat');
    const btnCast = document.getElementById('btn-cast');
    const btnStreamMode = document.getElementById('stream-mode-btn');
    const exitStreamBtn = document.getElementById('exit-stream-overlay-btn');

    let isShuffle = false;
    let isRepeat = false;

    const playNext = () => {
        if (isRepeat) { audio.currentTime = 0; audio.play(); return; }

        // ── Olden Days playlist is driving ───────────────────────────────────
        if (activePlaylistId === QUEUE_OLDEN_DAYS || currentQueue === goldenPlaylistQueue) {
            if (goldenPlaylistQueue.length === 0) {
                goldenPlaylistQueue = getGoldenTracks();
                currentGoldenIdx = -1;
            }
            if (goldenPlaylistQueue.length === 0) return;

            const nextGoldenIdx = isShuffle
                ? Math.floor(Math.random() * goldenPlaylistQueue.length)
                : currentGoldenIdx + 1;

            if (nextGoldenIdx >= goldenPlaylistQueue.length) {
                // Olden Days finished — wrap back to start of Music I 💙
                musicILoveQueue = buildMusicILoveQueue();
                if (musicILoveQueue.length === 0) return;
                musicILoveIdx = 0;
                activePlaylistId = QUEUE_MUSIC_I_LOVE;
                currentQueue = musicILoveQueue;
                currentTrackIndex = libraryTracks.indexOf(musicILoveQueue[0]);
                const t = musicILoveQueue[0];
                playTrack(t.url, t.title, t.artist, t.cover, t.canvas);
                renderLibrary();
            } else {
                window.playPlaylistTrack(nextGoldenIdx);
            }
            return;
        }

        // ── Music I 💙 is driving ────────────────────────────────────────────
        musicILoveQueue = buildMusicILoveQueue();
        if (musicILoveQueue.length === 0) return;

        const nextLibIdx = isShuffle
            ? Math.floor(Math.random() * musicILoveQueue.length)
            : musicILoveIdx + 1;

        if (nextLibIdx >= musicILoveQueue.length) {
            // Music I 💙 exhausted — transition to Olden Days
            const oldenTracks = getGoldenTracks();
            if (oldenTracks.length > 0) {
                activePlaylistId = QUEUE_OLDEN_DAYS;
                goldenPlaylistQueue = oldenTracks;
                currentGoldenIdx = 0;
                currentQueue = goldenPlaylistQueue;
                const t = goldenPlaylistQueue[0];
                currentTrackIndex = libraryTracks.indexOf(t);
                playTrack(t.url, t.title, t.artist, t.cover, t.canvas);
                const si = document.getElementById('playlist-search');
                renderPlaylist(si ? si.value : '');
            } else {
                // No Olden Days tracks — wrap Music I 💙 back to start
                musicILoveIdx = 0;
                const t = musicILoveQueue[0];
                currentTrackIndex = libraryTracks.indexOf(t);
                playTrack(t.url, t.title, t.artist, t.cover, t.canvas);
                renderLibrary();
            }
        } else {
            musicILoveIdx = nextLibIdx;
            currentQueue = musicILoveQueue;
            const t = musicILoveQueue[musicILoveIdx];
            currentTrackIndex = libraryTracks.indexOf(t);
            playTrack(t.url, t.title, t.artist, t.cover, t.canvas);
            renderLibrary();
        }
    };

    const playPrev = () => {
        // ── Olden Days playlist is driving ───────────────────────────────────
        if (activePlaylistId === QUEUE_OLDEN_DAYS || currentQueue === goldenPlaylistQueue) {
            if (goldenPlaylistQueue.length === 0) return;
            const prevGoldenIdx = isShuffle
                ? Math.floor(Math.random() * goldenPlaylistQueue.length)
                : (currentGoldenIdx - 1 + goldenPlaylistQueue.length) % goldenPlaylistQueue.length;
            window.playPlaylistTrack(prevGoldenIdx);
            return;
        }

        // ── Music I 💙 is driving ────────────────────────────────────────────
        musicILoveQueue = buildMusicILoveQueue();
        if (musicILoveQueue.length === 0) return;
        const prevIdx = isShuffle
            ? Math.floor(Math.random() * musicILoveQueue.length)
            : (musicILoveIdx - 1 + musicILoveQueue.length) % musicILoveQueue.length;
        musicILoveIdx = prevIdx;
        currentQueue = musicILoveQueue;
        const t = musicILoveQueue[musicILoveIdx];
        currentTrackIndex = libraryTracks.indexOf(t);
        playTrack(t.url, t.title, t.artist, t.cover, t.canvas);
        renderLibrary();
    };

    if(btnNext) btnNext.onclick = playNext;
    if(btnNextOverlay) btnNextOverlay.onclick = playNext;
    if(btnPrev) btnPrev.onclick = playPrev;
    if(btnPrevOverlay) btnPrevOverlay.onclick = playPrev;

    if(btnShuffle) btnShuffle.onclick = () => {
        isShuffle = !isShuffle;
        btnShuffle.style.opacity = isShuffle ? '1' : '0.6';
        btnShuffle.style.color = isShuffle ? 'var(--primary-blue)' : 'white';
    };

    if(btnRepeat) btnRepeat.onclick = () => {
        isRepeat = !isRepeat;
        btnRepeat.style.opacity = isRepeat ? '1' : '0.6';
        btnRepeat.style.color = isRepeat ? 'var(--primary-blue)' : 'white';
        audio.loop = isRepeat;
    };

    // Data Saver Toggle
    const btnDataSaver = document.getElementById('data-saver-btn');
    window.isDataSaver = localStorage.getItem('isDataSaver') === 'true';
    
    const updateDataSaverUI = () => {
        if(btnDataSaver) {
            btnDataSaver.style.color = window.isDataSaver ? 'var(--primary-blue)' : 'white';
            btnDataSaver.style.opacity = window.isDataSaver ? '1' : '0.6';
            if(window.isDataSaver) {
                btnDataSaver.classList.add('active-glow');
            } else {
                btnDataSaver.classList.remove('active-glow');
            }
        }
    };
    updateDataSaverUI();

    if(btnDataSaver) btnDataSaver.onclick = () => {
        const confirmMsg = window.isDataSaver ? "Turn off Data Saver and enable video covers?" : "Enable Data Saver? This will turn off video covers to save mobile data.";
        if(confirm(confirmMsg)) {
            window.isDataSaver = !window.isDataSaver;
            localStorage.setItem('isDataSaver', window.isDataSaver);
            updateDataSaverUI();
            
            // If playing, refresh current track view
            const currentTrack = currentQueue[currentTrackIndex];
            if(currentTrack) updateUI(currentTrack.title, currentTrack.artist, currentTrack.cover, currentTrack.canvas);
        }
    };



    [btnPlay, btnPlayOverlay].forEach(btn => {
        if(btn) btn.addEventListener('click', () => {
            if (!audio.src) return;
            initVisualizer(); 
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            isPlaying ? audio.pause() : audio.play();
            isPlaying = !isPlaying;
            updatePlayIcons();
        });
    });

    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        document.querySelectorAll('.progress-fill').forEach(bar => bar.style.width = progress + '%');
    });

    audio.addEventListener('ended', () => { playNext(); });

    // Audio Visualizer & EQ Logic
    let audioCtx, analyser, source, dataArray;
    let bassFilter, midFilter, trebleFilter;
    let isSurround = false;
    
    const canvas = document.getElementById('visualizer-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        const initVisualizer = () => {
            if (audioCtx) return;
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                
                // Create EQ Filters
                bassFilter = audioCtx.createBiquadFilter();
                bassFilter.type = 'lowshelf';
                bassFilter.frequency.value = 200;
                
                midFilter = audioCtx.createBiquadFilter();
                midFilter.type = 'peaking';
                midFilter.frequency.value = 1000;
                midFilter.Q.value = 1;
                
                trebleFilter = audioCtx.createBiquadFilter();
                trebleFilter.type = 'highshelf';
                trebleFilter.frequency.value = 3000;

                source = audioCtx.createMediaElementSource(audio);
                
                // Chain: Source -> EQ -> Analyser -> Dest
                source.connect(bassFilter);
                bassFilter.connect(midFilter);
                midFilter.connect(trebleFilter);
                trebleFilter.connect(analyser);
                analyser.connect(audioCtx.destination);
                
                analyser.fftSize = 256;
                dataArray = new Uint8Array(analyser.frequencyBinCount);
                animateVisualizer();
                setupEQControls();
            } catch (e) {
                console.warn("Visualizer init failed:", e);
            }
        };

        const miniCanvas = document.getElementById('mini-visualizer');
        const miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;

        const animateVisualizer = () => {
            requestAnimationFrame(animateVisualizer);
            if (!isPlaying) {
                if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                if(miniCtx) miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
                return;
            }

            analyser.getByteFrequencyData(dataArray);
            
            // 1. Full Screen Overlay Visualizer
            if (nowPlayingOverlay && nowPlayingOverlay.style.display !== 'none') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;

                const lowFreq = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
                const midFreq = dataArray.slice(10, 40).reduce((a, b) => a + b, 0) / 30;
                const highFreq = dataArray.slice(40, 100).reduce((a, b) => a + b, 0) / 60;

                const drawPulse = (radius, opacity, freq, color) => {
                    const scale = 1 + (freq / 255) * 0.8;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.globalAlpha = opacity;
                    ctx.shadowBlur = 40 * (freq / 255);
                    ctx.shadowColor = '#00E5FF';
                    ctx.fill();
                };

                ctx.shadowBlur = 0;
                drawPulse(220, 0.1, lowFreq, 'rgba(0, 229, 255, 0.1)');
                drawPulse(180, 0.2, midFreq, 'rgba(0, 229, 255, 0.2)');
                drawPulse(140, 0.4, highFreq, 'rgba(0, 229, 255, 0.3)');
                
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 200 + (lowFreq / 4), 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // 2. Mini Player Bar Visualizer (Glow Bars)
            if (miniCtx) {
                miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
                const barWidth = (miniCanvas.width / (dataArray.length / 2));
                let barHeight;
                let x = 0;

                for (let i = 0; i < dataArray.length / 2; i++) {
                    barHeight = (dataArray[i] / 255) * miniCanvas.height;
                    
                    // Create a gradient for the bar
                    const gradient = miniCtx.createLinearGradient(0, miniCanvas.height - barHeight, 0, miniCanvas.height);
                    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
                    gradient.addColorStop(1, 'rgba(0, 229, 255, 0.05)');
                    
                    miniCtx.fillStyle = gradient;
                    miniCtx.fillRect(x, miniCanvas.height - barHeight, barWidth - 1, barHeight);
                    x += barWidth;
                }
            }
        };
        
        window.initVisualizer = initVisualizer;
    }

    // Overlay Toggle
    const nowPlayingOverlay = document.getElementById('now-playing-overlay');
    const currentTrackDiv = document.querySelector('.current-track');
    const closeOverlayBtn = document.getElementById('close-overlay');

    window.toggleNowPlaying = () => {
        if (!nowPlayingOverlay) return;
        const isHidden = nowPlayingOverlay.style.display === 'none' || nowPlayingOverlay.style.display === '';
        
        if (isHidden) {
            nowPlayingOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Keep body hidden while overlay is open
            if (isPlaying) initVisualizer(); 
        } else {
            nowPlayingOverlay.style.display = 'none';
            document.body.style.overflow = 'hidden'; // Ensure it stays hidden as per CSS root
        }
    };

    if(closeOverlayBtn) closeOverlayBtn.onclick = (e) => { e.stopPropagation(); toggleNowPlaying(); };
    if(currentTrackDiv) {
        if(btnCast) {
            btnCast.onclick = (e) => {
                e.stopPropagation();
                window.toggleCastPortal();
            };
        }

        currentTrackDiv.style.cursor = 'pointer';
        currentTrackDiv.onclick = toggleNowPlaying;
    }

    const volumeSlider = document.getElementById('volume-slider');
    if(volumeSlider) {
        const updateVolumeBackground = (val) => {
            const percentage = val * 100;
            volumeSlider.style.background = `linear-gradient(to right, var(--primary-blue) ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%)`;
        };

        volumeSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            audio.volume = val;
            updateVolumeBackground(val);
        });
        
        // Initialize
        updateVolumeBackground(volumeSlider.value);
    }

    // Authentication Logic
    const authScreen = document.getElementById('auth-screen');
    const authInput = document.getElementById('auth-pass');
    const authBtn = document.getElementById('auth-btn');
    const authError = document.getElementById('auth-error');

    const verifyAccess = () => {
        const pass = authInput.value.trim();
        if (pass === "SHADOW") {
            // Success animation
            authScreen.style.opacity = '0';
            authScreen.style.transform = 'scale(1.1)';
            setTimeout(() => {
                authScreen.style.display = 'none';
                document.body.style.overflow = 'hidden'; // Restore intended overflow
            }, 500);
            sessionStorage.setItem('stressTuneAuth', 'true');
        } else {
            // Failure animation
            authInput.style.borderColor = '#FF4B2B';
            authError.style.display = 'block';
            authInput.classList.add('shake');
            setTimeout(() => authInput.classList.remove('shake'), 500);
            authInput.value = "";
        }
    };

    // Check existing session
    if (sessionStorage.getItem('stressTuneAuth') === 'true') {
        authScreen.style.display = 'none';
        document.body.style.overflow = 'hidden';
    }

    if (authBtn) authBtn.onclick = verifyAccess;
    if (authInput) {
        authInput.onkeypress = (e) => { if (e.key === 'Enter') verifyAccess(); };
        authInput.oninput = () => {
            authInput.style.borderColor = 'var(--glass-border)';
            authError.style.display = 'none';
        };
    }
    // Cast Portal Logic (Real-Time Discovery Integration via Google Cast API)
    const castPortal = document.getElementById('cast-portal');
    const castScanning = document.getElementById('cast-scanning');
    const castList = document.getElementById('cast-list');
    const castConnected = document.getElementById('cast-connected');
    const castStatusText = castScanning ? castScanning.querySelector('p') : null;

    let castSession = null;
    let currentMediaSession = null;

    window.__onGCastApiAvailable = function(isAvailable) {
        if (isAvailable) {
            initializeCastApi();
        }
    };

    function initializeCastApi() {
        cast.framework.CastContext.getInstance().setOptions({
            receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
        
        const context = cast.framework.CastContext.getInstance();
        context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, function(event) {
            switch (event.sessionState) {
                case cast.framework.SessionState.SESSION_STARTED:
                case cast.framework.SessionState.SESSION_RESUMED:
                    castSession = context.getCurrentSession();
                    const deviceName = castSession.getCastDevice().friendlyName || "TV";
                    
                    // Show connected UI
                    if (castPortal) castPortal.style.display = 'block';
                    if (castScanning) castScanning.style.display = 'none';
                    if (castList) castList.style.display = 'none';
                    if (castConnected) castConnected.style.display = 'block';
                    document.getElementById('connected-device-name').innerText = deviceName;
                    document.querySelectorAll('#btn-cast').forEach(btn => btn.style.color = 'var(--primary-blue)');
                    
                    if (window.updateCastDisplay) window.updateCastDisplay();
                    loadMediaIntoCast();
                    break;
                case cast.framework.SessionState.SESSION_ENDED:
                    castSession = null;
                    currentMediaSession = null;
                    if (castPortal) castPortal.style.display = 'none';
                    document.querySelectorAll('#btn-cast').forEach(btn => btn.style.color = 'white');
                    break;
            }
        });
    }

    window.toggleCastPortal = async () => {
        if (typeof cast === 'undefined' || !cast.framework) {
            alert("Google Cast is not available in this browser. Please use Chrome/Edge.");
            return;
        }

        cast.framework.CastContext.getInstance().requestSession().then(
            function() {
                console.log("Cast session started successfully");
            },
            function(errorCode) {
                console.log('Error starting cast session: ' + errorCode);
            }
        );
    };

    function loadMediaIntoCast() {
        if (!castSession) return;
        if (currentTrackIndex === -1 || !currentQueue[currentTrackIndex]) return;
        
        const track = currentQueue[currentTrackIndex];
        let mediaUrl = track.url;
        let mimeType = 'audio/mp3';

        if (track.canvas && !window.isDataSaver) {
            mediaUrl = track.canvas;
            mimeType = 'video/mp4';
        }

        let mediaInfo = new chrome.cast.media.MediaInfo(mediaUrl, mimeType);
        let metadata = new chrome.cast.media.MusicTrackMediaMetadata();
        metadata.title = track.title;
        metadata.artist = track.artist;
        const coverUrl = track.cover.startsWith('http') ? track.cover : window.location.origin + '/' + track.cover;
        metadata.images = [new chrome.cast.Image(coverUrl)];
        mediaInfo.metadata = metadata;
        
        let request = new chrome.cast.media.LoadRequest(mediaInfo);
        
        if (audio && !audio.paused) {
            request.currentTime = audio.currentTime;
        }
        
        castSession.loadMedia(request).then(
            function() { console.log('Media loaded on cast device'); },
            function(errorCode) { console.log('Error loading media: ' + errorCode); }
        );
    }

    window.connectDevice = (name) => {
        // Fallback for UI if clicked from the old mock list
        window.toggleCastPortal();
    };

    window.updateCastDisplay = () => {
        const castNowPlaying = document.getElementById('cast-now-playing');
        if (!castNowPlaying) return;
        
        if (currentTrackIndex !== -1 && currentQueue[currentTrackIndex]) {
            const track = currentQueue[currentTrackIndex];
            const castArt = document.getElementById('cast-art');
            const castVideo = document.getElementById('cast-video');

            if (track.canvas && !window.isDataSaver) {
                if (castArt) castArt.style.display = 'none';
                if (castVideo) {
                    castVideo.src = track.canvas;
                    castVideo.style.display = 'block';
                    castVideo.play().catch(e => console.log(e));
                }
            } else {
                if (castVideo) {
                    castVideo.pause();
                    castVideo.src = '';
                    castVideo.style.display = 'none';
                }
                if (castArt) {
                    castArt.src = track.cover;
                    castArt.style.display = 'block';
                }
            }

            document.getElementById('cast-title').innerText = track.title;
            document.getElementById('cast-artist').innerText = track.artist;
            castNowPlaying.style.display = 'flex';
            loadMediaIntoCast(); // update the actual cast device
        } else {
            castNowPlaying.style.display = 'none';
        }
    };

    window.disconnectDevice = () => {
        if (castSession) {
            cast.framework.CastContext.getInstance().endCurrentSession(true);
        }
        if (castConnected) castConnected.style.display = 'none';
        if (castList) castList.style.display = 'flex';
        document.querySelectorAll('#btn-cast').forEach(btn => btn.style.color = 'white');
        if(castStatusText) castStatusText.innerText = "Scanning WiFi for available devices...";
    };

    const closeCast = document.getElementById('close-cast');
    if(closeCast) closeCast.onclick = () => {
        if (castPortal) castPortal.style.display = 'none';
    };

    const setupEQControls = () => {
        const bassSliders = [document.getElementById('eq-bass'), document.getElementById('eq-bass-side')];
        const midSliders = [document.getElementById('eq-mid'), document.getElementById('eq-mid-side')];
        const trebleSliders = [document.getElementById('eq-treble'), document.getElementById('eq-treble-side')];
        const surroundBtns = [document.getElementById('eq-surround'), document.getElementById('eq-surround-side')];

        const syncSliders = (sliders, val) => {
            sliders.forEach(s => { if(s) s.value = val; });
        };

        bassSliders.forEach(slider => {
            if(slider) slider.oninput = (e) => { 
                const val = e.target.value;
                if(bassFilter) bassFilter.gain.value = val;
                syncSliders(bassSliders, val);
            };
        });

        midSliders.forEach(slider => {
            if(slider) slider.oninput = (e) => { 
                const val = e.target.value;
                if(midFilter) midFilter.gain.value = val;
                syncSliders(midSliders, val);
            };
        });

        trebleSliders.forEach(slider => {
            if(slider) slider.oninput = (e) => { 
                const val = e.target.value;
                if(trebleFilter) trebleFilter.gain.value = val;
                syncSliders(trebleSliders, val);
            };
        });
        
        surroundBtns.forEach(btn => {
            if(btn) btn.onclick = () => {
                isSurround = !isSurround;
                surroundBtns.forEach(b => { if(b) b.classList.toggle('active', isSurround); });
                
                const val = isSurround ? 8 : 0;
                if(bassFilter) bassFilter.gain.value = val;
                if(trebleFilter) trebleFilter.gain.value = val;
                
                syncSliders(bassSliders, val);
                syncSliders(trebleSliders, val);
            };
        });
    };

    // Discord Integration & Stream Mode
    const discordBtn = document.getElementById('discord-btn');
    const discordModal = document.getElementById('discord-modal');
    const discordWebhookInput = document.getElementById('discord-webhook-url');
    const saveDiscordWebhook = document.getElementById('save-discord-webhook');
    const streamModeBtn = document.getElementById('stream-mode-btn');

    let streamModeActive = false;
    let discordWebhook = localStorage.getItem('stressTuneDiscordWebhook') || '';

    if (discordWebhookInput) discordWebhookInput.value = discordWebhook;

    if (discordBtn) {
        discordBtn.onclick = () => {
            discordModal.style.display = 'flex';
        };
    }

    if (saveDiscordWebhook) {
        saveDiscordWebhook.onclick = () => {
            discordWebhook = discordWebhookInput.value.trim();
            localStorage.setItem('stressTuneDiscordWebhook', discordWebhook);
            discordModal.style.display = 'none';
            if (discordWebhook) {
                alert("Discord Stream Sync Active!");
                sendDiscordNotification("PARADISE 音楽 Sync", "Connected to Discord", "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778145351/deep_focus_m0z8m8.png");
            }
        };
    }

    if (streamModeBtn) {
        streamModeBtn.onclick = () => {
            streamModeActive = !streamModeActive;
            document.body.classList.toggle('stream-mode', streamModeActive);
            streamModeBtn.style.color = streamModeActive ? 'var(--primary-blue)' : 'white';
            
            if (streamModeActive) {
                const overlay = document.getElementById('now-playing-overlay');
                if (overlay && overlay.style.display === 'none') {
                    overlay.style.display = 'block';
                }
            }
        };
    }

    const exitStreamOverlayBtn = document.getElementById('exit-stream-overlay-btn');
    if (exitStreamOverlayBtn) {
        exitStreamOverlayBtn.onclick = () => {
            streamModeActive = false;
            document.body.classList.remove('stream-mode');
            if (streamModeBtn) streamModeBtn.style.color = 'white';
            const overlay = document.getElementById('now-playing-overlay');
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = 'hidden'; 
        };
    }

    function sendDiscordNotification(title, artist, cover) {
        if (!discordWebhook || !discordWebhook.startsWith('https://discord.com')) return;
        
        const payload = {
            embeds: [{
                title: "Now Playing on PARADISE 音楽 🎵",
                description: `**${title}**\nby ${artist}`,
                thumbnail: { url: cover.startsWith('http') ? cover : window.location.origin + '/' + cover },
                color: 5814783, 
                timestamp: new Date(),
                footer: { text: "Streaming live via PARADISE 音楽 Platform" }
            }]
        };

        fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Discord Sync Error:", err));
    };

    // Desktop Now Playing Notification (non-mobile only)
    function sendDesktopNotification(title, artist, cover) {
        // Skip on mobile/touch devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (isMobile) return;
        if (!('Notification' in window)) return;

        const fireNotif = () => {
            const iconUrl = cover && cover.startsWith('http') ? cover : window.location.origin + '/' + cover;
            const notif = new Notification('PARADISE 音楽 — Now Playing', {
                body: `${title}\n${artist}`,
                icon: iconUrl,
                badge: 'https://res.cloudinary.com/dhocv2p3t/image/upload/v1778145351/deep_focus_m0z8m8.png',
                silent: true,
                tag: 'paradise-now-playing' // Replaces previous notification instead of stacking
            });
            // Auto-close after 4 seconds
            setTimeout(() => notif.close(), 4000);
        };

        if (Notification.permission === 'granted') {
            fireNotif();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') fireNotif();
            });
        }
    };

    renderHome();
    setupEQControls();
    console.log('PARADISE 音楽: High-Fidelity Canvas Ready');

    // Cinematic Intro Sequence
    const runIntro = () => {
        try {
            const introOverlay = document.getElementById('intro-overlay');
            const introCanvas = document.getElementById('intro-canvas');
            const introScene = document.getElementById('intro-scene');
            const introMoon = document.getElementById('intro-moon');
            const introFinalLogo = document.getElementById('intro-final-logo');

            if (!introOverlay || !introCanvas) {
                console.warn("Intro elements missing");
                return;
            }

            const ctx = introCanvas.getContext('2d');
            let width, height, clouds = [];

            const resize = () => {
                width = introCanvas.width = window.innerWidth;
                height = introCanvas.height = window.innerHeight;
                clouds = Array.from({ length: 15 }, () => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: 200 + Math.random() * 300,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    opacity: 0.1 + Math.random() * 0.2,
                    color: Math.random() > 0.5 ? 'rgba(147, 51, 234,' : 'rgba(79, 70, 229,'
                }));
            };

            const animateClouds = () => {
                if (!introOverlay || introOverlay.style.display === 'none') return;
                ctx.clearRect(0, 0, width, height);
                
                clouds.forEach(cloud => {
                    cloud.x += cloud.vx;
                    cloud.y += cloud.vy;

                    if (cloud.x < -cloud.radius) cloud.x = width + cloud.radius;
                    if (cloud.x > width + cloud.radius) cloud.x = -cloud.radius;
                    if (cloud.y < -cloud.radius) cloud.y = height + cloud.radius;
                    if (cloud.y > height + cloud.radius) cloud.y = -cloud.radius;

                    const grad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
                    grad.addColorStop(0, cloud.color + cloud.opacity + ')');
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
                    ctx.fill();
                });
                requestAnimationFrame(animateClouds);
            };

            window.addEventListener('resize', resize);
            resize();
            animateClouds();

            // Sequence timing
            setTimeout(() => { if(introCanvas) introCanvas.style.opacity = '1'; }, 500);
            setTimeout(() => { 
                if(introScene) {
                    introScene.style.opacity = '1';
                    introScene.style.transform = 'scale(1)';
                }
            }, 1500);

            // Beat drop effect
            const introSound = new Audio('https://res.cloudinary.com/dhhn1410c/video/upload/v1778488976/GEAR_5_jy1htl.mp3');
            introSound.volume = 0.5;

            // Sound effect (2 seconds before beat drop)
            setTimeout(() => {
                introSound.play().catch(e => console.warn("Intro audio blocked:", e));
            }, 3500);

            // Beat drop effect
            setTimeout(() => {
                if(introOverlay) introOverlay.style.background = '#fff'; // Flash
                if(introScene) {
                    introScene.style.transition = 'all 0.1s ease-out';
                    introScene.style.transform = 'scale(1.1)';
                }
                
                setTimeout(() => {
                    if(introOverlay) {
                        introOverlay.style.background = '#000';
                        introOverlay.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
                    }
                    if(introScene) introScene.style.transform = 'scale(1)';
                    if(introMoon) introMoon.style.opacity = '0';
                    if(introFinalLogo) introFinalLogo.style.opacity = '1';
                }, 100);
            }, 5500);

            // Final transition to auth screen
            setTimeout(() => {
                if(introOverlay) {
                    introOverlay.style.opacity = '0';
                    setTimeout(() => {
                        introOverlay.style.display = 'none';
                    }, 1000);
                }
            }, 8500);
        } catch (e) {
            console.error("Intro Error:", e);
            const overlay = document.getElementById('intro-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    };

    runIntro();
});
