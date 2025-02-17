const DEFAULT_AJAX_RESPONSE_TIMEOUT = 300000;
const DB_NAME = `flq`;
const COUNTRY_SET = [
    "AE","AR","BH","BO","BR","CL",
    "CN","CO","CR","CU","DE","DO",
    "DZ","EC","EG","ES","FR","GB",
    "GQ","GT","HN","ID","IN","IQ",
    "IT","JO","JP","KR","KW","LB",
    "MA","MR","MX","MY","NI","PA",
    "PE","PH","PR","PY","QA","RU",
    "SA","SD","SO","SV","TH","TN",
    "US","UY","VE","VN"
];

const COUNTRY_LANG_SET = [
    {"code":"AF","locale":"ps_AF"},{"code":"AX","locale":"sv_AX"},{"code":"AL","locale":"sq_AL"},{"code":"DZ","locale":"ar_DZ"},{"code":"AS","locale":"en_AS"},{"code":"AO","locale":"pt_AO"},
    {"code":"AI","locale":"en_AI"},{"code":"AG","locale":"en_AG"},{"code":"AR","locale":"es_AR"},{"code":"AM","locale":"hy_AM"},{"code":"AW","locale":"nl_AW"},{"code":"AU","locale":"en_AU"},
    {"code":"AT","locale":"de_AT"},{"code":"AZ","locale":"az"},{"code":"BS","locale":"en_BS"},{"code":"BH","locale":"ar_BH"},{"code":"BD","locale":"bn_BD"},{"code":"BB","locale":"en_BB"},
    {"code":"BY","locale":"be_BY"},{"code":"BE","locale":"en_BE"},{"code":"BZ","locale":"es_BZ"},{"code":"BJ","locale":"fr_BJ"},{"code":"BM","locale":"en_BM"},{"code":"BT","locale":"dz_BT"},
    {"code":"BO","locale":"es_BO"},{"code":"BA","locale":"bs_BA"},{"code":"BW","locale":"en_BW"},{"code":"BR","locale":"pt_BR"},{"code":"IO","locale":"en_IO"},{"code":"VG","locale":"en_VG"},
    {"code":"BN","locale":"ms_BN"},{"code":"BG","locale":"bg_BG"},{"code":"BF","locale":"fr_BF"},{"code":"BI","locale":"fr_BI"},{"code":"KH","locale":"km_KH"},{"code":"CM","locale":"fr_CM"},
    {"code":"CA","locale":"en_CA"},{"code":"CV","locale":"kea_CV"},{"code":"BQ","locale":"nl_BQ"},{"code":"KY","locale":"en_KY"},{"code":"CF","locale":"fr_CF"},{"code":"TD","locale":"fr_TD"},
    {"code":"CL","locale":"es_CL"},{"code":"CN","locale":"zh"},{"code":"CX","locale":"en_CX"},{"code":"CC","locale":"en_CC"},{"code":"CO","locale":"es_CO"},{"code":"KM","locale":"fr_KM"},
    {"code":"CG","locale":"fr_CG"},{"code":"CD","locale":"fr_CD"},{"code":"CK","locale":"en_CK"},{"code":"CR","locale":"es_CR"},{"code":"CI","locale":"fr_CI"},{"code":"HR","locale":"hr_HR"},
    {"code":"CU","locale":"es_CU"},{"code":"CW","locale":"nl_CW"},{"code":"CY","locale":"en_CY"},{"code":"CZ","locale":"cs_CZ"},{"code":"DK","locale":"da_DK"},{"code":"DJ","locale":"fr_DJ"},
    {"code":"DM","locale":"en_DM"},{"code":"DO","locale":"es_DO"},{"code":"EC","locale":"es_EC"},{"code":"EG","locale":"ar_EG"},{"code":"SV","locale":"es_SV"},{"code":"GQ","locale":"es_GQ"},
    {"code":"ER","locale":"en_ER"},{"code":"EE","locale":"et_EE"},{"code":"SZ","locale":"en_SZ"},{"code":"ET","locale":"om_ET"},{"code":"FK","locale":"en_FK"},{"code":"FO","locale":"fo_FO"},
    {"code":"FJ","locale":"en_FJ"},{"code":"FI","locale":"fi_FI"},{"code":"FR","locale":"fr_FR"},{"code":"GF","locale":"fr_GF"},{"code":"PF","locale":"fr_PF"},{"code":"TF","locale":"fr_TF"},
    {"code":"GA","locale":"fr_GA"},{"code":"GM","locale":"en_GM"},{"code":"GE","locale":"ka_GE"},{"code":"DE","locale":"de_DE"},{"code":"GH","locale":"ak_GH"},{"code":"GI","locale":"en_GI"},
    {"code":"GR","locale":"el_GR"},{"code":"GL","locale":"kl_GL"},{"code":"GD","locale":"en_GD"},{"code":"GP","locale":"fr_GP"},{"code":"GU","locale":"en_GU"},{"code":"GT","locale":"es_GT"},
    {"code":"GG","locale":"en_GG"},{"code":"GN","locale":"fr_GN"},{"code":"GW","locale":"pt_GW"},{"code":"GY","locale":"en_GY"},{"code":"HT","locale":"fr_HT"},{"code":"HN","locale":"es_HN"},
    {"code":"HK","locale":"en_HK"},{"code":"HU","locale":"hu_HU"},{"code":"IS","locale":"is_IS"},{"code":"IN","locale":"en_IN"},{"code":"ID","locale":"id_ID"},{"code":"IR","locale":"fa_IR"},
    {"code":"IQ","locale":"ar_IQ"},{"code":"IE","locale":"en_IE"},{"code":"IM","locale":"en_IM"},{"code":"IL","locale":"en_IL"},{"code":"IT","locale":"it_IT"},{"code":"JM","locale":"en_JM"},
    {"code":"JP","locale":"ja_JP"},{"code":"JE","locale":"en_JE"},{"code":"JO","locale":"ar_JO"},{"code":"KZ","locale":"kk_Cyrl_KZ"},{"code":"KE","locale":"en_KE"},{"code":"KI","locale":"en_KI"},
    {"code":"KW","locale":"ar_KW"},{"code":"KG","locale":"ky_KG"},{"code":"LA","locale":"lo_LA"},{"code":"LV","locale":"lv_LV"},{"code":"LB","locale":"ar_LB"},{"code":"LS","locale":"en_LS"},
    {"code":"LR","locale":"en_LR"},{"code":"LY","locale":"ar_LY"},{"code":"LI","locale":"de_LI"},{"code":"LT","locale":"lt_LT"},{"code":"LU","locale":"de_LU"},{"code":"MO","locale":"en_MO"},
    {"code":"MG","locale":"fr_MG"},{"code":"MW","locale":"en_MW"},{"code":"MY","locale":"ms_MY"},{"code":"MV","locale":"dv_MV"},{"code":"ML","locale":"fr_ML"},{"code":"MT","locale":"en_MT"},
    {"code":"MH","locale":"en_MH"},{"code":"MQ","locale":"fr_MQ"},{"code":"MU","locale":"en_MU"},{"code":"YT","locale":"fr_YT"},{"code":"MX","locale":"es_MX"},{"code":"FM","locale":"en_FM"},
    {"code":"MD","locale":"ro_MD"},{"code":"MC","locale":"fr_MC"},{"code":"MN","locale":"mn_MN"},{"code":"ME","locale":"sr_Latn_ME"},{"code":"MS","locale":"en_MS"},{"code":"MA","locale":"ar_MA"},
    {"code":"MZ","locale":"mgh_MZ"},{"code":"MM","locale":"my_MM"},{"code":"NA","locale":"en_NA"},{"code":"NR","locale":"en_NR"},{"code":"NP","locale":"ne_NP"},{"code":"NL","locale":"nl_NL"},
    {"code":"AN","locale":"nl_AN"},{"code":"NC","locale":"fr_NC"},{"code":"NZ","locale":"en_NZ"},{"code":"NI","locale":"es_NI"},{"code":"NE","locale":"fr_NE"},{"code":"NG","locale":"ig_NG"},
    {"code":"NU","locale":"en_NU"},{"code":"NF","locale":"en_NF"},{"code":"MP","locale":"en_MP"},{"code":"KP","locale":"ko_KP"},{"code":"MK","locale":"mk_MK"},{"code":"NO","locale":"nn_NO"},
    {"code":"OM","locale":"ar_OM"},{"code":"PK","locale":"en_PK"},{"code":"PW","locale":"en_PW"},{"code":"PS","locale":"ar_PS"},{"code":"PA","locale":"es_PA"},{"code":"PG","locale":"en_PG"},
    {"code":"PY","locale":"es_PY"},{"code":"PE","locale":"es_PE"},{"code":"PH","locale":"en_PH"},{"code":"PN","locale":"en_PN"},{"code":"PL","locale":"pl_PL"},{"code":"PT","locale":"pt_PT"},
    {"code":"PR","locale":"es_PR"},{"code":"QA","locale":"ar_QA"},{"code":"RE","locale":"fr_RE"},{"code":"RO","locale":"ro_RO"},{"code":"RU","locale":"ru_RU"},{"code":"RW","locale":"rw_RW"},
    {"code":"WS","locale":"en_WS"},{"code":"SM","locale":"it_SM"},{"code":"ST","locale":"pt_ST"},{"code":"SA","locale":"ar_SA"},{"code":"SN","locale":"fr_SN"},{"code":"RS","locale":"sr_Latn_RS"},
    {"code":"SC","locale":"fr_SC"},{"code":"SL","locale":"en_SL"},{"code":"SG","locale":"en_SG"},{"code":"SX","locale":"en_SX"},{"code":"SK","locale":"sk_SK"},{"code":"SI","locale":"sl_SI"},
    {"code":"SB","locale":"en_SB"},{"code":"SO","locale":"ar_SO"},{"code":"ZA","locale":"en_ZA"},{"code":"KR","locale":"ko_KR"},{"code":"SS","locale":"ar_SS"},{"code":"ES","locale":"eu_ES"},
    {"code":"LK","locale":"si_LK"},{"code":"BL","locale":"fr_BL"},{"code":"SH","locale":"en_SH"},{"code":"KN","locale":"en_KN"},{"code":"LC","locale":"en_LC"},{"code":"MF","locale":"fr_MF"},
    {"code":"PM","locale":"fr_PM"},{"code":"VC","locale":"en_VC"},{"code":"SD","locale":"ar_SD"},{"code":"SR","locale":"nl_SR"},{"code":"SJ","locale":"nb_SJ"},{"code":"SE","locale":"sv_SE"},
    {"code":"CH","locale":"de_CH"},{"code":"SY","locale":"ar_SY"},{"code":"TW","locale":"zh_Hant_TW"},{"code":"TJ","locale":"tg_TJ"},{"code":"TZ","locale":"en"},{"code":"TH","locale":"th_TH"},
    {"code":"TL","locale":"pt_TL"},{"code":"TG","locale":"ee_TG"},{"code":"TK","locale":"en_TK"},{"code":"TO","locale":"to_TO"},{"code":"TT","locale":"en_TT"},{"code":"TN","locale":"ar_TN"},
    {"code":"TR","locale":"tr_TR"},{"code":"TM","locale":"tk_TM"},{"code":"TC","locale":"en_TC"},{"code":"TV","locale":"en_TV"},{"code":"UM","locale":"en_UM"},{"code":"VI","locale":"en_VI"},
    {"code":"UG","locale":"cgg_UG"},{"code":"UA","locale":"uk_UA"},{"code":"US","locale":"en_US"},{"code":"AE","locale":"ar_AE"},{"code":"GB","locale":"en_UK"},{"code":"UY","locale":"es_UY"},
    {"code":"UZ","locale":"uz_Latn_UZ"},{"code":"VU","locale":"fr_VU"},{"code":"VA","locale":"it_VA"},{"code":"VE","locale":"es_VE"},{"code":"VN","locale":"vi_VN"},{"code":"WF","locale":"fr_WF"},
    {"code":"EH","locale":"ar_EH"},{"code":"YE","locale":"ar_YE"},{"code":"ZM","locale":"bem_ZM"},{"code":"ZW","locale":"en_ZW"}
];

const WHISPER_LANG_LIST = [
    {"language": "EN",  "name": "english"},     {"language": "ZH",  "name": "chinese"},     {"language": "DE",  "name": "german"},      {"language": "ES",  "name": "spanish"},     {"language": "RU",  "name": "russian"},
    {"language": "KO",  "name": "korean"},      {"language": "FR",  "name": "french"},      {"language": "JA",  "name": "japanese"},    {"language": "PT",  "name": "portuguese"},  {"language": "TR",  "name": "turkish"},
    {"language": "PL",  "name": "polish"},      {"language": "CA",  "name":  "catalan"},    {"language": "NL",  "name":  "dutch"},      {"language": "AR",  "name":  "arabic"},     {"language": "SV",  "name":  "swedish"},
    {"language": "IT",  "name":  "italian"},    {"language": "ID",  "name":  "indonesian"}, {"language": "HI",  "name":  "hindi"},      {"language": "FI",  "name":  "finnish"},    {"language": "VI",  "name":  "vietnamese"},
    {"language": "HE",  "name":  "hebrew"},     {"language": "UK",  "name":  "ukrainian"},  {"language": "EL",  "name":  "greek"},      {"language": "MS",  "name":  "malay"},      {"language": "CS",  "name":  "czech"},
    {"language": "RO",  "name":  "romanian"},   {"language": "DA",  "name":  "danish"},     {"language": "HU",  "name":  "hungarian"},  {"language": "TA",  "name":  "tamil"},      {"language": "NO",  "name":  "norwegian"},
    {"language": "TH",  "name":  "thai"},       {"language": "UR",  "name":  "urdu"},       {"language": "HR",  "name":  "croatian"},   {"language": "BG",  "name":  "bulgarian"},  {"language": "LT",  "name":  "lithuanian"},
    {"language": "LA",  "name":  "latin"},      {"language": "MI",  "name":  "maori"},      {"language": "ML",  "name":  "malayalam"},  {"language": "CY",  "name":  "welsh"},      {"language": "SK",  "name":  "slovak"},
    {"language": "TE",  "name":  "telugu"},     {"language": "FA",  "name":  "persian"},    {"language": "LV",  "name":  "latvian"},    {"language": "BN",  "name":  "bengali"},    {"language": "SR",  "name":  "serbian"},
    {"language": "AZ",  "name":  "azerbaijani"},{"language": "SL",  "name":  "slovenian"},  {"language": "KN",  "name":  "kannada"},    {"language": "ET",  "name":  "estonian"},   {"language": "MK",  "name":  "macedonian"},
    {"language": "BR",  "name":  "breton"},     {"language": "EU",  "name":  "basque"},     {"language": "IS",  "name":  "icelandic"},  {"language": "HY",  "name":  "armenian"},   {"language": "NE",  "name":  "nepali"},
    {"language": "MN",  "name":  "mongolian"},  {"language": "BS",  "name":  "bosnian"},    {"language": "KK",  "name":  "kazakh"},     {"language": "SQ",  "name":  "albanian"},   {"language": "SW",  "name":  "swahili"},
    {"language": "GL",  "name":  "galician"},   {"language": "MR",  "name":  "marathi"},    {"language": "PA",  "name":  "punjabi"},    {"language": "SI",  "name":  "sinhala"},    {"language": "KM",  "name":  "khmer"},
    {"language": "SN",  "name":  "shona"},      {"language": "YO",  "name":  "yoruba"},     {"language": "SO",  "name":  "somali"},     {"language": "AF",  "name":  "afrikaans"},  {"language": "OC",  "name":  "occitan"},
    {"language": "KA",  "name":  "georgian"},   {"language": "BE",  "name":  "belarusian"}, {"language": "TG",  "name":  "tajik"},      {"language": "SD",  "name":  "sindhi"},     {"language": "GU",  "name":  "gujarati"},
    {"language": "AM",  "name":  "amharic"},    {"language": "YI",  "name":  "yiddish"},    {"language": "LO",  "name":  "lao"},        {"language": "UZ",  "name":  "uzbek"},      {"language": "FO",  "name":  "faroese"},
    {"language": "HT",  "name":  "haitian creole"},{"language": "PS",  "name":  "pashto"},  {"language": "TK",  "name":  "turkmen"},    {"language": "NN",  "name":  "nynorsk"},    {"language": "MT",  "name":  "maltese"},
    {"language": "SA",  "name":  "sanskrit"},   {"language": "LB",  "name":  "luxembourgish"},{"language": "MY",  "name":  "myanmar"},  {"language": "BO",  "name":  "tibetan"},    {"language": "TL",  "name":  "tagalog"},
    {"language": "MG",  "name":  "malagasy"},   {"language": "AS",  "name":  "assamese"},   {"language": "TT",  "name":  "tatar"},      {"language": "HAW", "name":  "hawaiian"},   {"language": "LN",  "name":  "lingala"},
    {"language": "HA",  "name":  "hausa"},      {"language": "BA",  "name":  "bashkir"},    {"language": "JW",  "name":  "javanese"},   {"language": "SU",  "name":  "sundanese"},  {"language": "YUE", "name":  "cantonese"}
];