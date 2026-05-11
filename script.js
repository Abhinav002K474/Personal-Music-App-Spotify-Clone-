document.addEventListener('DOMContentLoaded', () => {
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

    // Persistent Storage
    const saveLibrary = () => {
        localStorage.setItem('stressTuneLibrary', JSON.stringify(libraryTracks));
    };

    // Load from storage or use defaults
    const defaultTracks = [
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
        { "title": "The Resistance Official Lyric Video", "artist": "Skillet", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093611/Skillet_-_The_Resistance_Official_Lyric_Video_tabkgg.mp3", "cover": "midnight_rain.png" },
        { "title": "Awake and Alive Official Audio", "artist": "Skillet", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Skillet_-_Awake_and_Alive_Official_Audio_zcymmq.mp3", "cover": "zen_garden.png" },
        { "title": "Perfect Official Video HD", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Simple_Plan_-_Perfect_Official_Video_HD_pr8iqb.mp3", "cover": "neon_beats.png" },
        { "title": "Welcome To My Life Official Video", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Simple_Plan_-_Welcome_To_My_Life_Official_Video_ragvye.mp3", "cover": "zen_garden.png" },
        { "title": "Not Gonna Die OFFICIAL MUSIC VIDEO", "artist": "Skillet", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093608/Skillet_-_Not_Gonna_Die_OFFICIAL_MUSIC_VIDEO_n1fprj.mp3", "cover": "midnight_rain.png" },
        { "title": "Eenie Meenie Lyrics", "artist": "Sean Kingston Justin Bieber", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093604/Sean_Kingston_Justin_Bieber_-_Eenie_Meenie_Lyrics_ez7b6c.mp3", "cover": "zen_garden.png" },
        { "title": "Last One Standing HQ", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093603/Simple_Plan_-_Last_One_Standing_HQ_lvtrgc.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778329581/YTDown_YouTube_SAO-AMV-Kirito-Tribute-Last-One-Standing_Media_rJvH7oOSRBQ_001_720p_ezytk3.mp4" },
        { "title": "This Song Saved My Life", "artist": "Simple Plan", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093603/Simple_Plan_-_This_Song_Saved_My_Life_su9dpe.mp3", "cover": "midnight_rain.png" },
        { "title": "Love Me Not Lyrics", "artist": "Ravyn Lenae", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093602/Ravyn_Lenae_-_Love_Me_Not_Lyrics_hywg7p.mp3", "cover": "midnight_rain.png" },
        { "title": "Rise", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093601/Rise_vd0c0o.mp3", "cover": "zen_garden.png" },
        { "title": "Dandelions Lyrics", "artist": "Ruth B.", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093597/Ruth_B._-_Dandelions_Lyrics_ro6pjb.mp3", "cover": "neon_beats.png" },
        { "title": "APT. Official Music Video", "artist": "ROSE Bruno Mars", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093597/ROSE_Bruno_Mars_-_APT._Official_Music_Video_zdi0j1.mp3", "cover": "zen_garden.png" },
        { "title": "KINGS QUEENS", "artist": "Qin shi huang vs Hades", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093594/Qin_shi_huang_vs_Hades_KINGS_QUEENS_mpcpoh.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778215631/Classroom_of_the_Elite_III_AMV_Kings_Queens_-_Luc%D1%87_%D3%87%D1%94%CE%B1rt%E1%83%A6_720p_h264_bqgpfe.mp4" },
        { "title": "Grateful Copyright Free No.54", "artist": "NEFFEX", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093591/NEFFEX_-_Grateful_Copyright_Free_No.54_n1znzm.mp3", "cover": "neon_beats.png" },
        { "title": "House of Memories", "artist": "Panic At The Disco", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093589/Panic_At_The_Disco_-_House_of_Memories_jhan2s.mp3", "cover": "midnight_rain.png" },
        { "title": "Unforgettable freestyle lyrics", "artist": "PnB Rock", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093589/PnB_Rock_-_Unforgettable_freestyle_lyrics_l5qwwj.mp3", "cover": "midnight_rain.png" },
        { "title": "Passenger Let Her Go Official Video", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093588/Passenger_Let_Her_Go_Official_Video_mcvfge.mp3", "cover": "zen_garden.png" },
        { "title": "Courtesy Call", "artist": "Nightcore", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093587/Nightcore_-_Courtesy_Call_yrf5kr.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778232193/vidssave.com_Kalos_League_Showdown_AMV_Courtesy_Call_-_Pokemon_XYZ_1080P_gzmf5b.mp4" },
        { "title": "Animals Lyrics", "artist": "Maroon 5", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093586/Maroon_5_-_Animals_Lyrics_xewnpl.mp3", "cover": "zen_garden.png" },
        { "title": "Rumors Copyright Free No.12", "artist": "NEFFEX", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093584/NEFFEX_-_Rumors_Copyright_Free_No.12_puohps.mp3", "cover": "midnight_rain.png" },
        { "title": "Night Changes", "artist": "One Direction", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093582/One_Direction_-_Night_Changes_tbdrhz.mp3", "cover": "zen_garden.png" },
        { "title": "Darkside", "artist": "NEONI", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778264297/NEONI_-_Darkside_Lyrics_soia8k.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778264000/vidssave.com_The_Eminence_in_Shadow_AMV_-_Darkside_1080P_uo8vq9.mp4" },
        { "title": "Love Story Lyrics", "artist": "Indila", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093577/Indila_-_Love_Story_Lyrics_frfupr.mp3", "cover": "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778164404/The_legend_of_the_maiden_espwa3.webp", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217932/Love_story_...Follow_sliceofanime_0_for_more_..._pokemon_theghostofmaidenspeak_sadanimeedit_mds8xw.mp4" },
        { "title": "Young and Beautiful 1", "artist": "Lana Del Rey", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093577/Lana_Del_Rey_-_Young_and_Beautiful_1_mwnvnu.mp3", "cover": "midnight_rain.png" },
        { "title": "League of Legends", "artist": "Legends Never Die ft. Against The Current", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093576/Legends_Never_Die_ft._Against_The_Current_OFFICIAL_AUDIO_Worlds_2017_-_League_of_Legends_lc63y8.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778345464/vidssave.com_Legends_Never_Die___Ezio_Auditore___Assassin_s_Creed___GMV_1080p_bjgz4d.mp4" },
        { "title": "Stereo Hearts Lyrics Heart Stereo", "artist": "Gym Class Heroes", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093574/Gym_Class_Heroes_-_Stereo_Hearts_Lyrics_Heart_Stereo_lrv1cb.mp3", "cover": "neon_beats.png" },
        { "title": "On The Floor ft. Pitbull", "artist": "Jennifer Lopez", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093574/Jennifer_Lopez_-_On_The_Floor_ft._Pitbull_xw6kz0.mp3", "cover": "zen_garden.png" },
        { "title": "Summertime Sadness Official Music Video", "artist": "Lana Del Rey", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093571/Lana_Del_Rey_-_Summertime_Sadness_Official_Music_Video_ju5dqe.mp3", "cover": "midnight_rain.png" },
        { "title": "Die With A Smile", "artist": "Lady Gaga Bruno Mars", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093571/Lady_Gaga_Bruno_Mars_-_Die_With_A_Smile_hskjah.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217207/Die_With_A_Smile_Eren_X_Mikasa_AMV_-_ToastLmao_1080p_h264_mgn6x0.mp4" },
        { "title": "Somewhere Only We Know Lyrics", "artist": "Keane", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093571/Keane_-_Somewhere_Only_We_Know_Lyrics_ivjhnl.mp3", "cover": "neon_beats.png" },
        { "title": "Heat Waves Full Version", "artist": "Glass animals x HighCloud Cover", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093566/Heat_Waves_-_Glass_animals_x_HighCloud_Cover_Full_Version_v19c1e.mp3", "cover": "midnight_rain.png" },
        { "title": "The Phoenix Part 2 of 11", "artist": "Fall Out Boy", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093565/Fall_Out_Boy_-_The_Phoenix_Official_Video_-_Part_2_of_11_xsllmm.mp3", "cover": "midnight_rain.png" },
        { "title": "Mockingbird Lyrics", "artist": "Eminem", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093560/Eminem_-_Mockingbird_Lyrics_bcn8fg.mp3", "cover": "zen_garden.png" },
        { "title": "Fairytale", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093560/Fairytale_lxzstg.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778438594/vidssave.com_Fairytale_-_AMV_-_Anime_MIX_720P_bvwxet.mp4" },
        { "title": "Perfect Lyrics", "artist": "Ed Sheeran", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093558/Ed_Sheeran_-_Perfect_Lyrics_yhbbdg.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482939/vidssave.com_Perfect_-_AMV_-_Anime_MV_720p60_wxckgb.mp4" },
        { "title": "Love Me Like You Do Lyrics", "artist": "Ellie Goulding", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093558/Ellie_Goulding_-_Love_Me_Like_You_Do_Lyrics_x699mn.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482299/vidssave.com_amu_ikuto___love_me_like_you_do_720P_lzsffp.mp4" },
        { "title": "Gangsta s Paradise feat. L.V. Official Music Video", "artist": "Coolio", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093556/Coolio_-_Gangsta_s_Paradise_feat._L.V._Official_Music_Video_vgpvl1.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778263902/AMV_-_Tokyo_revengers_-_gangster_paradise_Toman_vs_Valhalla_xkehvs.mp4" },
        { "title": "Royalty ft. Neoni Official Lyric Video", "artist": "Egzod Maestro Chives", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093556/Egzod_Maestro_Chives_-_Royalty_ft._Neoni_Official_Lyric_Video_zzklxh.mp3", "cover": "neon_beats.png" },
        { "title": "discord x my ordinary life mashup", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093554/discord_x_my_ordinary_life_slowed_reverb_full_mashup_ffoshx.mp3", "cover": "zen_garden.png" },
        { "title": "Runaway Lyrics", "artist": "AURORA", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093550/AURORA_-_Runaway_Lyrics_ycromm.mp3", "cover": "midnight_rain.png" },
        { "title": "A Thousand Years", "artist": "Christina Perri", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093549/Christina_Perri_-_A_Thousand_Years_pbdqk7.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778217932/Love_story_...Follow_sliceofanime_0_for_more_..._pokemon_theghostofmaidenspeak_sadanimeedit_mds8xw.mp4" },
        { "title": "Hymn For The Weekend Lyrics", "artist": "Coldplay", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093549/Coldplay_-_Hymn_For_The_Weekend_Lyrics_bt19jp.mp3", "cover": "neon_beats.png" },
        { "title": "LET THE WORLD BURN Official Lyric Video", "artist": "Chris Grey", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093547/Chris_Grey_-_LET_THE_WORLD_BURN_Official_Lyric_Video_k9hoxo.mp3", "cover": "zen_garden.png" },
        { "title": "Broken Angel Lyrics Ft.Helena Im so lonely", "artist": "Arash", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093545/Arash_-_Broken_Angel_Lyrics_Ft.Helena_Im_so_lonely_broken_angel_xvxhwn.mp3", "cover": "midnight_rain.png" },
        { "title": "Let Me Down Slowly", "artist": "Alec Benjamin", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093543/Alec_Benjamin_-_Let_Me_Down_Slowly_kcvram.mp3", "cover": "zen_garden.png" },
        { "title": "The Nights Lyrics my father told me", "artist": "Avicii", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093542/Avicii_-_The_Nights_Lyrics_my_father_told_me_e5svqx.mp3", "cover": "neon_beats.png" },
        { "title": "Moral Of The Story Lyrics 1", "artist": "Ashe", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093541/Ashe_-_Moral_Of_The_Story_Lyrics_1_a8zmg3.mp3", "cover": "zen_garden.png" },
        { "title": "I Wanna Be Yours Instrumental Best part looped", "artist": "Arctic Monkeys", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093541/Arctic_Monkeys_-_I_Wanna_Be_Yours_Instrumental_Best_part_looped_z7ljqh.mp3", "cover": "midnight_rain.png" },
        { "title": "End Of Me Pseudo Video", "artist": "Ashes Remain", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093539/Ashes_Remain_-_End_Of_Me_Pseudo_Video_lktk4s.mp3", "cover": "zen_garden.png" },
        { "title": "2 Phut Hon phao Lyrics kaiz Remix", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093539/2_Phut_Hon_-_phao_Lyrics_kaiz_Remix_phut_Hon_remix_lyrics_TikTok_Song_Sub._English_-_Lyrics_d1a3ex.mp3", "cover": "neon_beats.png" },
        { "title": "Moral Of The Story Lyrics", "artist": "Ashe", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093536/Ashe_-_Moral_Of_The_Story_Lyrics_pjdv1o.mp3", "cover": "zen_garden.png" },
        { "title": "I Wanna Be Yours Lyrics", "artist": "Arctic Monkeys", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093533/Arctic_Monkeys_-_I_Wanna_Be_Yours_Lyrics_tool3t.mp3", "cover": "midnight_rain.png" },
        { "title": "Alone Pt. II Lyrics", "artist": "Alan Walker Ava Max", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093533/Alan_Walker_Ava_Max_-_Alone_Pt._II_Lyrics_nr1wnq.mp3", "cover": "zen_garden.png" },
        { "title": "On My Way", "artist": "Alan Walker Sabrina Carpenter Farruko", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093529/Alan_Walker_Sabrina_Carpenter_Farruko_-_On_My_Way_t6nwnc.mp3", "cover": "neon_beats.png" },
        { "title": "Faded", "artist": "Alan Walker", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778093529/Alan_Walker_-_Faded_rqjfr9.mp3", "cover": "zen_garden.png" },

        { "title": "Carry On Detective Pikachu Official Video", "artist": "Unknown Artist", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778159311/Carry_On_from_the_Original_Motion_Picture_POK%C3%89MON_Detective_Pikachu_Official_Video_izizw7.mp3", "cover": "midnight_rain.png" },
        { "title": "Another Love Lyrics", "artist": "Tom Odell", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778159299/Tom_Odell_-_Another_Love_Lyrics_a6ewel.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778218884/Sanji_Pudding_Their_Story_-_Another_Love_AMV_-_Riddler_Thriller_1080p_h264_twghwl.mp4" },
        { "title": "Atlantis Lyrics", "artist": "Seafret", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778159299/Seafret_-_Atlantis_Lyrics_vg7dhz.mp3", "cover": "neon_beats.png" },
        { "title": "Sad Song", "artist": "We The Kings ft. Elena Coats", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778179435/We_The_Kings_-_Sad_Song_Lyric_Video_ft._Elena_Coats_y2vbxu.mp3", "cover": "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778179316/download_b4rtyo.jpg" },
        { "title": "Hikaru Nara", "artist": "Goose house", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778215441/Hikaru_Nara_-_Goose_House_Romaji_Espa%C3%B1ol_English_Color_Coded_jehopo.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778216563/Your_Lie_in_April_OP_Opening_Theme_-_Hikaru_Nara_-_AniClipsCollection_720p_h264_okikjc.mp4" },
        { "title": "Mortals", "artist": "Warriyo ft. Laura Brehm", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778231345/Warriyo_-_Mortals_ft._Laura_Brehm_o8vhwd.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778231291/vidssave.com_Hayato_Awakening___Garena_Free_Fire_720P_ysgs64.mp4" },
        { "title": "Alone x Fadded", "artist": "Alan Walker Mashup", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778231726/Alan_Walker_Mashup_Lyrics_Alone_X_Faded_X_Alone_Pt._2_X_On_My_Way..._alanwalker_fadedxaloneptii_afscdd.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778231741/vidssave.com_ANIME_EYES_EDIT___THIS_IS_4K_ANIME_EYES___PEPEKACHU_1080P_izqkmk.mp4" },
        { "title": "Shatter Me", "artist": "Lindsey Stirling ft. Lzzy Hale", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778346095/Lindsey_Stirling_-_Shatter_Me_ft._Lzzy_Hale_Lyrics_wztopr.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778345854/YTDown_YouTube_Naofumi-_-Raphtalia-Shatter-Me-AMV_Media_ffiphpTEZS8_001_720p_qlou9a.mp4" },
        { "title": "Royalty X Madara", "artist": "Madara Uchiha AMV", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778350313/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_48KBPS_ah4y1q.webm", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778350407/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_2160P_bwgy18.mp4" },
        { "title": "My Demons", "artist": "Starset", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778431256/Starset-My_Demons_Lyrics_Video_u1952b.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778431420/beyblade-amv-my-demons-720-ytshorts.savetube.me_e2w4e9.mp4" },
        { "title": "Stay with me", "artist": "Heavenly Jumpstyle", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778434792/HEAVENLY_JUMPSTYLE_Lyrics_woamjr.mp3", "cover": "neon_beats.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778434595/YTDown_Shorts_Resting-My-Eyes-Leon-Kennedy-Edit-HEAVEN_Media_9uZk7Ugr-Zc_002_720p_nf450q.mp4" },
        { "title": "Dynasty", "artist": "MIIA", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483126/MIIA_-_Dynasty_Lyrics_db8g63.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482821/YTDown_YouTube_Dynasty-AMV-Anime-Mix_Media_pmN_l7FuyIg_002_720p_vbrqdr.mp4" },
        { "title": "Love is Gone", "artist": "SLANDER ft. Dylan Matthew", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483122/SLANDER_-_Love_Is_Gone_ft._Dylan_Matthew_Acoustic_j4pugd.mp3", "cover": "midnight_rain.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482360/vidssave.com_Love_Is_Gone_AMV_MIX_1080P_ivxwrs.mp4" },
        { "title": "Infinity", "artist": "Jaymes Young", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483293/Jaymes_Young_-_Infinity_h8k3qg.mp3", "cover": "zen_garden.png", "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482714/vidssave.com_AMV_-_Infinity_%E1%B4%B4%E1%B4%B0_1080P_ka9jub.mp4" }
    ];
    let libraryTracks = JSON.parse(localStorage.getItem('stressTuneLibrary')) || defaultTracks;

    // Ensure the new songs are added if not present
    const hasSadSong = libraryTracks.some(t => t.title === "Sad Song");
    if (!hasSadSong) {
        libraryTracks.push({ "title": "Sad Song", "artist": "We The Kings ft. Elena Coats", "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778179435/We_The_Kings_-_Sad_Song_Lyric_Video_ft._Elena_Coats_y2vbxu.mp3", "cover": "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778179316/download_b4rtyo.jpg" });
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
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778218884/Sanji_Pudding_Their_Story_-_Another_Love_AMV_-_Riddler_Thriller_1080p_h264_twghwl.mp4";
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
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778231741/vidssave.com_ANIME_EYES_EDIT___THIS_IS_4K_ANIME_EYES___PEPEKACHU_1080P_izqkmk.mp4"
        });
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

    const hasRoyaltyXMadara = libraryTracks.some(t => t.title.includes("Royalty X Madara"));
    if (!hasRoyaltyXMadara) {
        libraryTracks.push({ 
            "title": "Royalty X Madara", 
            "artist": "Madara Uchiha AMV", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778350313/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_48KBPS_ah4y1q.webm", 
            "cover": "neon_beats.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778350407/vidssave.com_WAKE_UP_TO_REALITY_-_Madara_Uchiha_s_Words_-_Naruto_AMV_Edit_2160P_bwgy18.mp4"
        });
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
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482360/vidssave.com_Love_Is_Gone_AMV_MIX_1080P_ivxwrs.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Love is Gone");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482360/vidssave.com_Love_Is_Gone_AMV_MIX_1080P_ivxwrs.mp4";
    }

    const hasInfinity = libraryTracks.some(t => t.title === "Infinity");
    if (!hasInfinity) {
        libraryTracks.push({ 
            "title": "Infinity", 
            "artist": "Jaymes Young", 
            "url": "https://res.cloudinary.com/dhocv2p3t/video/upload/v1778483293/Jaymes_Young_-_Infinity_h8k3qg.mp3", 
            "cover": "zen_garden.png",
            "canvas": "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482714/vidssave.com_AMV_-_Infinity_%E1%B4%B4%E1%B4%B0_1080P_ka9jub.mp4"
        });
    } else {
        const track = libraryTracks.find(t => t.title === "Infinity");
        track.canvas = "https://res.cloudinary.com/dhhn1410c/video/upload/v1778482714/vidssave.com_AMV_-_Infinity_%E1%B4%B4%E1%B4%B0_1080P_ka9jub.mp4";
    }

    // Force migration: Remove any lingering profile images from song covers
    libraryTracks.forEach((track, idx) => {
        if (track.cover && track.cover.includes("download_b4rtyo.jpg")) {
            const fallbackCovers = ["neon_beats.png", "zen_garden.png", "midnight_rain.png"];
            track.cover = fallbackCovers[idx % fallbackCovers.length];
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
            homeGrid.innerHTML = libraryTracks.map((track, index) => {
                const originalIndex = libraryTracks.indexOf(track);
                return `
                    <div class="card" onclick="playLibraryTrack(${originalIndex})">
                        <div style="position: relative; overflow: hidden; border-radius: var(--radius-md);">
                            <img src="${track.cover}" alt="${track.title}" class="card-img" style="margin-bottom:0;">
                            <div class="card-play-btn" style="position: absolute; bottom: 12px; right: 12px; width: 48px; height: 48px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateY(10px); transition: all 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 2;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
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
            track.title.toLowerCase().includes(query.toLowerCase()) || 
            track.artist.toLowerCase().includes(query.toLowerCase())
        );

        if (libCount) libCount.innerText = `${filteredTracks.length} Tracks`;
        
        libraryTracklist.innerHTML = filteredTracks.map((track, index) => {
            const originalIndex = libraryTracks.indexOf(track);
            const isPlayingRow = (currentTrackIndex === originalIndex && currentQueue === libraryTracks);
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
                        <button onclick="renameTrack(${originalIndex}, event)" class="icon-btn" style="display: inline-flex; margin-right: 15px; opacity: 0.6;" title="Rename Track">
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
                track.title.toLowerCase().includes(query) || 
                track.artist.toLowerCase().includes(query)
            );

            searchTracklist.innerHTML = filtered.map((track, index) => {
                const originalIndex = libraryTracks.indexOf(track);
                const isPlayingRow = (currentTrackIndex === originalIndex && currentQueue === libraryTracks);
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
                        <td class="duration">3:45</td>
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

    window.playLibraryTrack = (index) => {
        currentQueue = libraryTracks;
        currentTrackIndex = index;
        const track = currentQueue[index];
        playTrack(track.url, track.title, track.artist, track.cover, track.canvas);
        renderLibrary(); // Update highlights
    };

    window.playAllLibrary = () => { if (libraryTracks.length > 0) playLibraryTrack(0); };

    window.showPlaylist = (name) => {
        showView('playlist-view');
        document.getElementById('playlist-name').innerText = name;
    };

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
    };

    const updateUI = (title, artist, cover, canvas) => {
        const playerName = document.getElementById('player-name');
        if (playerName) playerName.innerText = title;
        const playerArtist = document.getElementById('player-artist');
        if (playerArtist) playerArtist.innerText = artist;
        const playerArt = document.getElementById('player-art');
        if (playerArt) playerArt.src = cover;

        // Send Discord Notification if active
        sendDiscordNotification(title, artist, cover);

        const overlayName = document.getElementById('overlay-name');
        const overlayArtist = document.getElementById('overlay-artist');
        if (overlayName) overlayName.innerText = title;
        if (overlayArtist) overlayArtist.innerText = artist;
        
        const video = document.getElementById('overlay-video');
        const centerVideo = document.getElementById('center-video');
        const overlayArt = document.getElementById('overlay-art');
        const overlay = document.getElementById('now-playing-overlay');

        if (overlayArt) overlayArt.src = cover;

        if (canvas) {
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

            // Sync Logic: Ensure center video follows background video
            const syncVideos = () => {
                if (centerVideo && Math.abs(video.currentTime - centerVideo.currentTime) > 0.1) {
                    centerVideo.currentTime = video.currentTime;
                }
            };

            video.onplaying = () => {
                if(centerVideo) centerVideo.play();
            };
            video.onpause = () => {
                if(centerVideo) centerVideo.pause();
            };
            video.ontimeupdate = syncVideos;

            // Start playing both videos
            video.play().catch(e => console.log("Background video blocked:", e));
            if(centerVideo) centerVideo.play().catch(e => console.log("Center video blocked:", e));
            
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

    let isShuffle = false;
    let isRepeat = false;

    const playNext = () => {
        if (currentQueue.length === 0) return;
        currentTrackIndex = isShuffle ? Math.floor(Math.random() * currentQueue.length) : (currentTrackIndex + 1) % currentQueue.length;
        playLibraryTrack(currentTrackIndex);
    };

    const playPrev = () => {
        if (currentQueue.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + currentQueue.length) % currentQueue.length;
        playLibraryTrack(currentTrackIndex);
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

    audio.addEventListener('ended', () => { isRepeat ? audio.play() : playNext(); });

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
    // Cast Portal Logic (Real-Time Discovery Integration)
    const castPortal = document.getElementById('cast-portal');
    const castScanning = document.getElementById('cast-scanning');
    const castList = document.getElementById('cast-list');
    const castConnected = document.getElementById('cast-connected');
    const castStatusText = castScanning ? castScanning.querySelector('p') : null;
    
    let presentationRequest = null;
    try {
        if ('PresentationRequest' in window) {
            presentationRequest = new PresentationRequest(['https://personal-music-app-spotify-clone.vercel.app']);
        }
    } catch (e) { console.log("Presentation API not supported"); }

    window.toggleCastPortal = async () => {
        if (!castPortal) return;
        
        const isHidden = castPortal.style.display === 'none';
        if (isHidden) {
            castPortal.style.display = 'block';
            castScanning.style.display = 'block';
            castList.style.display = 'none';
            castConnected.style.display = 'none';
            if(castStatusText) castStatusText.innerText = "Scanning WiFi for available devices...";

            // Attempt Actual Browser Discovery
            if (presentationRequest) {
                presentationRequest.getAvailability()
                    .then(availability => {
                        console.log("Device availability:", availability.value);
                        if (availability.value) {
                            if(castStatusText) castStatusText.innerText = "Devices found! Preparing connection...";
                            setTimeout(() => {
                                castScanning.style.display = 'none';
                                castList.style.display = 'flex';
                            }, 1500);
                        } else {
                            // Fallback to high-fidelity mock if no physical devices are broadcasted
                            setTimeout(() => {
                                if(castStatusText) castStatusText.innerText = "Searching for nearby Stress-Link devices...";
                                setTimeout(() => {
                                    castScanning.style.display = 'none';
                                    castList.style.display = 'flex';
                                }, 2000);
                            }, 1000);
                        }
                    })
                    .catch(() => {
                        // General fallback
                        setTimeout(() => {
                            castScanning.style.display = 'none';
                            castList.style.display = 'flex';
                        }, 2500);
                    });
            } else {
                // Simulation for non-supported browsers
                setTimeout(() => {
                    castScanning.style.display = 'none';
                    castList.style.display = 'flex';
                }, 2500);
            }
        } else {
            castPortal.style.display = 'none';
        }
    };

    window.connectDevice = (name) => {
        castList.style.display = 'none';
        castScanning.style.display = 'block';
        if(castStatusText) castStatusText.innerText = `Establishing high-fidelity link to ${name}...`;
        
        // If real API is available, try to start a session
        if (presentationRequest) {
            presentationRequest.start()
                .then(connection => {
                    console.log("Connected to " + connection.url);
                    finalizeConnection(name);
                })
                .catch(err => {
                    console.log("Remote cast failed, using virtual link:", err);
                    finalizeConnection(name); // Fallback to virtual link if user cancels or fails
                });
        } else {
            finalizeConnection(name);
        }
    };

    const finalizeConnection = (name) => {
        setTimeout(() => {
            castScanning.style.display = 'none';
            castConnected.style.display = 'block';
            document.getElementById('connected-device-name').innerText = name;
            document.querySelectorAll('#btn-cast').forEach(btn => btn.style.color = 'var(--primary-blue)');
            
            // Sync Audio state if possible
            if(audio) audio.play();
        }, 2000);
    }

    window.disconnectDevice = () => {
        castConnected.style.display = 'none';
        castList.style.display = 'flex';
        document.querySelectorAll('#btn-cast').forEach(btn => btn.style.color = 'white');
        if(castStatusText) castStatusText.innerText = "Scanning WiFi for available devices...";
    };

    const closeCast = document.getElementById('close-cast');
    if(closeCast) closeCast.onclick = () => castPortal.style.display = 'none';

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
                sendDiscordNotification("Stress Tune Sync", "Connected to Discord", "https://res.cloudinary.com/dhocv2p3t/image/upload/v1778145351/deep_focus_m0z8m8.png");
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
                title: "Now Playing on Stress Tune 🎵",
                description: `**${title}**\nby ${artist}`,
                thumbnail: { url: cover.startsWith('http') ? cover : window.location.origin + '/' + cover },
                color: 5814783, 
                timestamp: new Date(),
                footer: { text: "Streaming live via Stress Tune Platform" }
            }]
        };

        fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Discord Sync Error:", err));
    };

    renderHome();
    setupEQControls();
    console.log('Stress Tune: High-Fidelity Canvas Ready');
});
