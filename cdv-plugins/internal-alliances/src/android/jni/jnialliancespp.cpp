//
//  JNIAlliances
//
#include <alliancespp.hpp>
#include <jnialliancespp.hpp>
using namespace std;

JNIEXPORT jstring JNICALL Java_app_internal_AlliancesJni_getVersionpp(JNIEnv* env, jclass thiz)
{
    std::string output = cpp_getVersion();
    return env->NewStringUTF(output.c_str());
}